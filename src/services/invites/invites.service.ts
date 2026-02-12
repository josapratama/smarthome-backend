import { prisma } from "../../lib/prisma";

export async function acceptInviteByToken(token: string) {
  const now = new Date();

  const inv = await prisma.homeInviteToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true, homeId: true, userId: true },
  });

  if (!inv) return { error: "INVITE_TOKEN_INVALID" as const };

  const result = await prisma
    .$transaction(async (tx) => {
      // ensure membership exists & invited
      const member = await tx.homeMember.findFirst({
        where: {
          homeId: inv.homeId,
          userId: inv.userId,
          status: "INVITED",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!member) {
        // token valid tapi membership sudah berubah/hilang → treat as invalid
        throw new Error("MEMBERSHIP_NOT_INVITED");
      }

      const updatedMember = await tx.homeMember.update({
        where: { id: member.id },
        data: { status: "ACTIVE", joinedAt: now },
        select: { homeId: true, userId: true, joinedAt: true },
      });

      await tx.homeInviteToken.update({
        where: { id: inv.id },
        data: { usedAt: now },
      });

      return updatedMember;
    })
    .catch(() => null);

  if (!result) return { error: "INVITE_TOKEN_INVALID" as const };

  return {
    homeId: result.homeId,
    userId: result.userId,
    joinedAt: result.joinedAt!,
  };
}
