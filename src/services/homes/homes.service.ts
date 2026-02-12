import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../lib/generated/prisma/client";

type AuthUser = { id: number; role: "USER" | "ADMIN" };

export async function listHomes(
  auth: AuthUser,
  filters: {
    ownerId?: number;
    ownerEmail?: string;
    limit?: number;
    cursor?: number;
  },
) {
  const take = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const cursor = filters.cursor;

  const whereUser: Prisma.HomeWhereInput = {
    deletedAt: null,
    OR: [
      { ownerUserId: auth.id },
      {
        members: {
          some: { userId: auth.id, status: "ACTIVE", deletedAt: null },
        },
      },
    ],
  };

  const whereAdmin: Prisma.HomeWhereInput = {
    deletedAt: null,
    ...(filters.ownerId || filters.ownerEmail
      ? {
          ownerUserId: filters.ownerId ?? undefined,
          owner: filters.ownerEmail ? { email: filters.ownerEmail } : undefined,
        }
      : {}),
  };

  const where: Prisma.HomeWhereInput =
    auth.role === "ADMIN" ? whereAdmin : whereUser;

  const homes = await prisma.home.findMany({
    where,
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const hasNext = homes.length > take;
  const items = hasNext ? homes.slice(0, take) : homes;
  const nextCursor = hasNext ? items[items.length - 1]!.id : null;

  return { homes: items, nextCursor };
}

export async function createHome(
  auth: AuthUser,
  input: { name: string; ownerUserId: number },
) {
  // USER hanya boleh bikin home untuk dirinya sendiri
  if (auth.role !== "ADMIN" && input.ownerUserId !== auth.id) {
    return { error: "FORBIDDEN" as const };
  }

  const owner = await prisma.userAccount.findUnique({
    where: { id: input.ownerUserId },
  });
  if (!owner) return { error: "OWNER_NOT_FOUND" as const };

  const home = await prisma.home.create({
    data: { name: input.name, ownerUserId: input.ownerUserId },
  });

  return { home };
}

async function canAccessHome(auth: AuthUser, homeId: number) {
  if (auth.role === "ADMIN") return true;

  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      deletedAt: null,
      OR: [
        { ownerUserId: auth.id },
        {
          members: {
            some: { userId: auth.id, status: "ACTIVE", deletedAt: null },
          },
        },
      ],
    },
    select: { id: true },
  });

  return !!home;
}

async function canManageHome(auth: AuthUser, homeId: number) {
  // manage = update/delete/restore: admin atau owner saja
  if (auth.role === "ADMIN") return true;

  const home = await prisma.home.findFirst({
    where: { id: homeId, ownerUserId: auth.id },
    select: { id: true },
  });

  return !!home;
}

export async function getHomeById(auth: AuthUser, homeId: number) {
  const ok = await canAccessHome(auth, homeId);
  if (!ok) return { error: "NOT_FOUND" as const }; // sengaja NOT_FOUND biar tidak bocor info

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  return { home };
}

export async function updateHome(
  auth: AuthUser,
  homeId: number,
  input: { name?: string; ownerUserId?: number },
) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  // hanya ADMIN yang boleh pindah owner
  if (input.ownerUserId != null && auth.role !== "ADMIN") {
    return { error: "FORBIDDEN" as const };
  }

  if (input.ownerUserId != null) {
    const owner = await prisma.userAccount.findUnique({
      where: { id: input.ownerUserId },
    });
    if (!owner) return { error: "OWNER_NOT_FOUND" as const };
  }

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: {
      name: input.name ?? undefined,
      ownerUserId: input.ownerUserId ?? undefined,
    },
  });

  return { home: updated };
}

export async function deleteHome(auth: AuthUser, homeId: number) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  await prisma.home.update({
    where: { id: homeId },
    data: { deletedAt: new Date() },
  });

  return { ok: true as const };
}

export async function restoreHome(auth: AuthUser, homeId: number) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: { not: null } },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: { deletedAt: null },
  });

  return { home: updated };
}
