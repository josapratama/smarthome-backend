import { prisma } from "../../lib/prisma";

type AccessResult =
  | { ok: true; reason: null }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" };

async function canAccessDevice(
  userId: number,
  deviceId: number,
): Promise<AccessResult & { homeId?: number }> {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, deletedAt: null },
    select: {
      id: true,
      homeId: true,
      pairedByUserId: true,
      home: {
        select: {
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

  if (!device) return { ok: false, reason: "NOT_FOUND" };

  const isOwner = device.home.ownerUserId === userId;
  const isMember = device.home.members.length > 0;

  if (isOwner || isMember)
    return { ok: true, reason: null, homeId: device.homeId };
  return { ok: false, reason: "FORBIDDEN" };
}

function mapConfigDTO(dc: any) {
  return {
    deviceId: dc.deviceId,
    config: dc.config,
    updatedBy: dc.updatedBy ?? null,
    updatedAt: dc.updatedAt.toISOString(),
    createdAt: dc.createdAt.toISOString(),
  };
}

export async function getDeviceConfig(args: {
  requesterUserId: number;
  deviceId: number;
}) {
  const access = await canAccessDevice(args.requesterUserId, args.deviceId);
  if (!access.ok) return { error: access.reason };

  const dc = await prisma.deviceConfig.findUnique({
    where: { deviceId: args.deviceId },
  });

  // kalau belum ada, kamu bisa return default empty config
  if (!dc) {
    return {
      data: {
        deviceId: args.deviceId,
        config: {},
        updatedBy: null,
        updatedAt: new Date(0).toISOString(),
        createdAt: new Date(0).toISOString(),
      },
    };
  }

  return { data: mapConfigDTO(dc) };
}

export async function upsertDeviceConfig(args: {
  requesterUserId: number;
  deviceId: number;
  config: any;
}) {
  const access = await canAccessDevice(args.requesterUserId, args.deviceId);
  if (!access.ok) return { error: access.reason };

  const dc = await prisma.deviceConfig.upsert({
    where: { deviceId: args.deviceId },
    create: {
      deviceId: args.deviceId,
      config: args.config,
      updatedBy: args.requesterUserId,
    },
    update: {
      config: args.config,
      updatedBy: args.requesterUserId,
    },
  });

  return { data: mapConfigDTO(dc) };
}
