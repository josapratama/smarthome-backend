import { prisma } from "../../lib/prisma";

type AccessResult =
  | { ok: true; reason: null }
  | { ok: false; reason: "HOME_NOT_FOUND" | "FORBIDDEN" };

async function canAccessHome(
  userId: number,
  homeId: number,
): Promise<AccessResult> {
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
  if (home.ownerUserId === userId || home.members.length > 0)
    return { ok: true, reason: null };
  return { ok: false, reason: "FORBIDDEN" };
}

function mapRoomDTO(r: any) {
  return {
    id: r.id,
    homeId: r.homeId,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}

export async function listRoomsByHome(args: {
  requesterUserId: number;
  homeId: number;
}) {
  const access = await canAccessHome(args.requesterUserId, args.homeId);
  if (!access.ok) return { error: access.reason };

  const rooms = await prisma.room.findMany({
    where: { homeId: args.homeId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return { data: rooms.map(mapRoomDTO) };
}

export async function createRoomUnderHome(args: {
  requesterUserId: number;
  homeId: number;
  name: string;
}) {
  const access = await canAccessHome(args.requesterUserId, args.homeId);
  if (!access.ok) return { error: access.reason };

  // opsional: prevent duplicate active name (Prisma schema cuma index, bukan unique)
  const exists = await prisma.room.findFirst({
    where: { homeId: args.homeId, name: args.name, deletedAt: null },
    select: { id: true },
  });
  if (exists) return { error: "ROOM_NAME_EXISTS" as const };

  const room = await prisma.room.create({
    data: { homeId: args.homeId, name: args.name },
  });

  return { room: mapRoomDTO(room) };
}

export async function getRoomById(args: {
  requesterUserId: number;
  roomId: number;
}) {
  const room = await prisma.room.findUnique({ where: { id: args.roomId } });
  if (!room || room.deletedAt) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, room.homeId);
  if (!access.ok) return { error: access.reason };

  return { room: mapRoomDTO(room) };
}

export async function updateRoom(args: {
  requesterUserId: number;
  roomId: number;
  name?: string;
}) {
  const room = await prisma.room.findUnique({ where: { id: args.roomId } });
  if (!room || room.deletedAt) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, room.homeId);
  if (!access.ok) return { error: access.reason };

  if (args.name) {
    const exists = await prisma.room.findFirst({
      where: {
        homeId: room.homeId,
        name: args.name,
        deletedAt: null,
        NOT: { id: room.id },
      },
      select: { id: true },
    });
    if (exists) return { error: "ROOM_NAME_EXISTS" as const };
  }

  const updated = await prisma.room.update({
    where: { id: args.roomId },
    data: { name: args.name },
  });

  return { room: mapRoomDTO(updated) };
}

export async function deleteRoom(args: {
  requesterUserId: number;
  roomId: number;
}) {
  const room = await prisma.room.findUnique({ where: { id: args.roomId } });
  if (!room || room.deletedAt) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, room.homeId);
  if (!access.ok) return { error: access.reason };

  // optional: unassign devices in this room
  await prisma.$transaction([
    prisma.device.updateMany({
      where: { roomId: room.id, deletedAt: null },
      data: { roomId: null },
    }),
    prisma.room.update({
      where: { id: room.id },
      data: { deletedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}

export async function restoreRoom(args: {
  requesterUserId: number;
  roomId: number;
}) {
  const room = await prisma.room.findUnique({ where: { id: args.roomId } });
  if (!room) return { error: "NOT_FOUND" as const };

  const access = await canAccessHome(args.requesterUserId, room.homeId);
  if (!access.ok) return { error: access.reason };

  const restored = await prisma.room.update({
    where: { id: room.id },
    data: { deletedAt: null },
  });

  return { room: mapRoomDTO(restored) };
}

export async function listDevicesByRoom(args: {
  requesterUserId: number;
  roomId: number;
}) {
  const room = await prisma.room.findUnique({
    where: { id: args.roomId },
    select: { id: true, homeId: true, deletedAt: true },
  });

  if (!room || room.deletedAt) return { error: "NOT_FOUND" as const };

  // reuse canAccessHome dari file yang sama
  // pastikan canAccessHome scope-nya bisa dipakai
  const access = await canAccessHome(args.requesterUserId, room.homeId);
  if (!access.ok)
    return { error: access.reason as "HOME_NOT_FOUND" | "FORBIDDEN" };

  const devices = await prisma.device.findMany({
    where: { roomId: room.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return { data: devices };
}
