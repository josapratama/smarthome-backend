import { prisma } from "../../lib/prisma";
import crypto from "crypto";

type CommandSource = "USER" | "BACKEND" | "AI" | "ADMIN";

// sesuai enum OtaJobStatus di schema
type OtaJobStatus =
  | "PENDING"
  | "SENT"
  | "DOWNLOADING"
  | "APPLIED"
  | "FAILED"
  | "TIMEOUT";

function uuid() {
  return crypto.randomUUID(); // Node >= 16
}

async function assertCanAccessDevice(opts: {
  requestedByUserId?: number;
  deviceId: number;
}) {
  if (!opts.requestedByUserId) return; // endpoint public / belum pakai auth

  const userId = opts.requestedByUserId;

  const device = await prisma.device.findFirst({
    where: { id: opts.deviceId, deletedAt: null },
    select: {
      id: true,
      homeId: true,
      home: {
        select: {
          deletedAt: true,
          ownerUserId: true,
          members: {
            where: { userId, deletedAt: null, status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!device || device.home.deletedAt) throw new Error("DEVICE_NOT_FOUND");

  const isOwner = device.home.ownerUserId === userId;
  const isMember = device.home.members.length > 0;

  if (!isOwner && !isMember) throw new Error("FORBIDDEN");
}

export class OtaService {
  /**
   * Trigger OTA update for a device using a firmware release.
   *
   * Creates:
   * - Command (type: "OTA_UPDATE", payload includes releaseId)
   * - OtaJob (status: PENDING, linked to commandId)
   */
  static async triggerDeviceOta(input: {
    requestUrl: string;
    deviceId: number;
    releaseId: number;

    // optional (kalau nanti endpoint OTA diproteksi)
    requestedByUserId?: number;

    // optional override
    source?: CommandSource;
  }): Promise<{
    otaJobId: number;
    commandId: number | null;
    status: OtaJobStatus;
  }> {
    await assertCanAccessDevice({
      requestedByUserId: input.requestedByUserId,
      deviceId: input.deviceId,
    });

    const [device, release] = await Promise.all([
      prisma.device.findFirst({
        where: { id: input.deviceId, deletedAt: null },
        select: { id: true, homeId: true, deletedAt: true },
      }),
      prisma.firmwareRelease.findFirst({
        where: { id: input.releaseId, deletedAt: null },
        select: { id: true, deletedAt: true },
      }),
    ]);

    if (!device) throw new Error("DEVICE_NOT_FOUND");
    if (!release) throw new Error("FIRMWARE_RELEASE_NOT_FOUND");

    // create Command + OtaJob atomically
    const result = await prisma.$transaction(async (tx) => {
      // Command.correlationId is UUID unique in schema
      const correlationId = uuid();

      const command = await tx.command.create({
        data: {
          deviceId: device.id,
          type: "OTA_UPDATE",
          payload: {
            releaseId: release.id,
            requestUrl: input.requestUrl,
          },
          status: "PENDING",
          requestedBy: input.requestedByUserId ?? null,
          source: (input.source ??
            (input.requestedByUserId ? "USER" : "BACKEND")) as any,
          correlationId, // @db.Uuid
        },
      });

      const job = await tx.otaJob.create({
        data: {
          deviceId: device.id,
          releaseId: release.id,
          status: "PENDING",
          progress: null,
          lastError: null,
          // milestones start as null
          sentAt: null,
          downloadingAt: null,
          appliedAt: null,
          failedAt: null,
          commandId: command.id,
        },
      });

      return { job, command };
    });

    // NOTE:
    // Di sini kamu bisa publish MQTT/queue worker untuk benar-benar mengirim OTA.
    // Kalau kamu punya worker, dia yang update:
    // - job.status -> SENT/DOWNLOADING/APPLIED/FAILED/TIMEOUT
    // - milestone timestamps
    // - command.status -> SENT/ACKED/FAILED/TIMEOUT + ackedAt/lastError
    return {
      otaJobId: result.job.id,
      commandId: result.command.id,
      status: result.job.status as OtaJobStatus,
    };
  }

  static async getOtaJobOrThrow(otaJobId: number) {
    const job = await prisma.otaJob.findUnique({
      where: { id: otaJobId },
      include: {
        device: { select: { id: true, deletedAt: true } },
        release: {
          select: {
            id: true,
            deletedAt: true,
            platform: true,
            version: true,
            sha256: true,
          },
        },
        command: {
          select: {
            id: true,
            status: true,
            ackedAt: true,
            lastError: true,
            correlationId: true,
          },
        },
      },
    });

    if (!job) throw new Error("NOT_FOUND");
    // optional hard rule: kalau device/release soft-deleted, tetap bisa baca history.
    return job;
  }

  static async listDeviceOtaJobs(deviceId: number, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);

    const jobs = await prisma.otaJob.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take,
    });

    return jobs;
  }

  // Optional helper kalau nanti mau update status dari worker
  static async updateOtaJobStatus(input: {
    otaJobId: number;
    status: OtaJobStatus;
    progress?: number | null;
    lastError?: string | null;
  }) {
    const now = new Date();

    // set milestone timestamps sesuai status
    const milestone: Record<string, any> = {};
    if (input.status === "SENT") milestone.sentAt = now;
    if (input.status === "DOWNLOADING") milestone.downloadingAt = now;
    if (input.status === "APPLIED") milestone.appliedAt = now;
    if (input.status === "FAILED" || input.status === "TIMEOUT")
      milestone.failedAt = now;

    return prisma.otaJob.update({
      where: { id: input.otaJobId },
      data: {
        status: input.status as any,
        progress: input.progress === undefined ? undefined : input.progress,
        lastError: input.lastError === undefined ? undefined : input.lastError,
        ...milestone,
      },
    });
  }
}
