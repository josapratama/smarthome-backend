import { prisma } from "../../../lib/prisma";

export async function listHomes(filters: {
  ownerId?: number;
  ownerEmail?: string;
}) {
  const { ownerId, ownerEmail } = filters;

  const homes = await prisma.home.findMany({
    where:
      ownerId || ownerEmail
        ? {
            ownerId: ownerId ?? undefined,
            owner: ownerEmail ? { is: { email: ownerEmail } } : undefined,
          }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  return homes;
}

export async function createHome(input: { name: string; ownerId: number }) {
  const owner = await prisma.userAccount.findUnique({
    where: { id: input.ownerId },
  });
  if (!owner) return { error: "OWNER_NOT_FOUND" as const };

  const home = await prisma.home.create({
    data: { name: input.name, ownerId: input.ownerId },
  });

  return { home };
}

export async function getHomeById(homeId: number) {
  const home = await prisma.home.findUnique({ where: { id: homeId } });
  if (!home) return { error: "NOT_FOUND" as const };
  return { home };
}
