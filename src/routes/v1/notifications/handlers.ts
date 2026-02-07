import { prisma } from "../../../lib/prisma";

export function mapEndpointDTO(r: any) {
  return {
    id: r.id,
    userId: r.userId,
    channel: r.channel,
    value: r.value,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listEndpoints(userId: number) {
  const rows = await prisma.notificationEndpoint.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows;
}

export async function createEndpoint(
  userId: number,
  body: { channel: any; value: string },
) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user) return { error: "USER_NOT_FOUND" as const };

  const row = await prisma.notificationEndpoint
    .create({ data: { userId, channel: body.channel, value: body.value } })
    .catch((e) => {
      if (String(e).toLowerCase().includes("unique")) return null;
      throw e;
    });

  if (!row) return { error: "ALREADY_EXISTS" as const };
  return { row };
}
