// src/services/homes/homes.service.ts
import { prisma } from "../../lib/prisma";

export async function listHomes(filters: {
  ownerId?: number;
  ownerEmail?: string;
}) {
  const { ownerId, ownerEmail } = filters;

  const homes = await prisma.home.findMany({
    where: {
      deletedAt: null,
      ...(ownerId || ownerEmail
        ? {
            ownerUserId: ownerId ?? undefined,
            owner: ownerEmail ? { email: ownerEmail } : undefined,
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return { homes };
}

export async function createHome(input: { name: string; ownerUserId: number }) {
  const owner = await prisma.userAccount.findUnique({
    where: { id: input.ownerUserId },
  });
  if (!owner) return { error: "OWNER_NOT_FOUND" as const };

  const home = await prisma.home.create({
    data: { name: input.name, ownerUserId: input.ownerUserId },
  });

  return { home };
}

export async function getHomeById(homeId: number) {
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };
  return { home };
}

export async function updateHome(
  homeId: number,
  input: { name?: string; ownerUserId?: number },
) {
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

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

export async function deleteHome(homeId: number) {
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

export async function restoreHome(homeId: number) {
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
