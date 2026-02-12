import { prisma } from "../../lib/prisma";
import { toISO } from "../../routes/v1/common/helpers";
import { generateDeviceKey } from "../../routes/v1/common/device-key";

export function mapDeviceDTO(d: any) {
  return {
    id: d.id,
    deviceName: d.deviceName,
    roomId: d.roomId ?? null,
    status: d.status,
    updatedAt: d.updatedAt.toISOString(),
    lastSeenAt: toISO(d.lastSeenAt),
    mqttClientId: d.mqttClientId ?? null,
    deviceKey: d.deviceKey ?? null,
    deviceType: d.deviceType,
    capabilities: d.capabilities ?? null,
    pairedByUserId: d.pairedByUserId,
    homeId: d.homeId,
  };
}

type HomeAccessResult =
  | { ok: true; reason: null }
  | { ok: false; reason: "HOME_NOT_FOUND" | "FORBIDDEN" };

async function canAccessHome(
  userId: number,
  homeId: number,
): Promise<HomeAccessResult> {
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: {
      ownerUserId: true,
      members: {
        where: { userId, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!home) return { ok: false, reason: "HOME_NOT_FOUND" };

  const isOwner = home.ownerUserId === userId;
  const isMember = home.members.length > 0;

  if (isOwner || isMember) return { ok: true, reason: null };
  return { ok: false, reason: "FORBIDDEN" };
}

export async function listDevices(input: {
  requesterUserId: number;
  homeId?: number;
  status?: boolean;
}) {
  // kalau filter homeId, enforce access
  if (input.homeId !== undefined) {
    const access = await canAccessHome(input.requesterUserId, input.homeId);
    if (!access.ok) return { error: access.reason };
  }

  const where: any = { deletedAt: null };

  if (input.homeId !== undefined) where.homeId = input.homeId;
  if (input.status !== undefined) where.status = input.status;

  // kalau tidak ada homeId, batasi ke homes yang dia owner/member
  if (input.homeId === undefined) {
    where.OR = [
      { home: { ownerUserId: input.requesterUserId } },
      {
        home: {
          members: {
            some: {
              userId: input.requesterUserId,
              deletedAt: null,
              status: "ACTIVE",
            },
          },
        },
      },
    ];
  }

  const data = await prisma.device.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return { data };
}

export async function createDeviceUnderHome(args: {
  requesterUserId: number;
  homeId: number;
  input: {
    deviceName: string;
    roomId?: number | null;
    mqttClientId?: string;
    deviceKey?: string | null;
    deviceType?: any;
    capabilities?: any | null;
  };
}) {
  const access = await canAccessHome(args.requesterUserId, args.homeId);
  if (!access.ok) return { error: access.reason };

  const deviceKey = args.input.deviceKey ?? generateDeviceKey();

  const device = await prisma.device.create({
    data: {
      homeId: args.homeId,
      pairedByUserId: args.requesterUserId, // ✅ sesuai schema baru
      deviceName: args.input.deviceName,
      roomId: args.input.roomId ?? null,
      mqttClientId: args.input.mqttClientId ?? null,
      deviceKey: deviceKey ?? null,
      deviceType: args.input.deviceType ?? "OTHER",
      capabilities: args.input.capabilities ?? null,
      status: false,
      pairedAt: new Date(),
    },
  });

  // optional: tulis pairing history
  await prisma.devicePairingHistory
    .create({
      data: {
        deviceId: device.id,
        userId: args.requesterUserId,
        homeId: args.homeId,
        method: "DEVICE_KEY",
        pairedAt: new Date(),
      },
    })
    .catch(() => null);

  return { device };
}

export async function getDeviceById(args: {
  requesterUserId: number;
  deviceId: number;
}) {
  const d = await prisma.device.findFirst({
    where: { id: args.deviceId, deletedAt: null },
    select: {
      id: true,
      homeId: true,
      deviceName: true,
      roomId: true,
      status: true,
      updatedAt: true,
      lastSeenAt: true,
      mqttClientId: true,
      deviceKey: true,
      deviceType: true,
      capabilities: true,
      pairedByUserId: true,
    },
  });
  if (!d) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, d.homeId);
  if (!access.ok) return { error: access.reason };

  return { device: d };
}

export async function patchDevice(args: {
  requesterUserId: number;
  deviceId: number;
  body: {
    deviceName?: string;
    roomId?: number | null;
    status?: boolean;
    lastSeenAt?: string | null;
    mqttClientId?: string | null;
    deviceKey?: string | null;
    deviceType?: any;
    capabilities?: any | null;
  };
}) {
  // fetch dulu buat cek homeId + authz
  const existing = await prisma.device.findFirst({
    where: { id: args.deviceId, deletedAt: null },
    select: { id: true, homeId: true },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, existing.homeId);
  if (!access.ok) return { error: access.reason };

  const d = await prisma.device.update({
    where: { id: args.deviceId },
    data: {
      deviceName: args.body.deviceName,
      roomId: args.body.roomId,
      status: args.body.status,
      lastSeenAt:
        args.body.lastSeenAt === undefined
          ? undefined
          : args.body.lastSeenAt === null
            ? null
            : new Date(args.body.lastSeenAt),
      mqttClientId: args.body.mqttClientId,
      deviceKey: args.body.deviceKey,
      deviceType: args.body.deviceType,
      capabilities: args.body.capabilities,
    },
  });

  return { device: d };
}
