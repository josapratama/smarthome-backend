import { prisma } from "../../lib/prisma";

type AuthUser = { id: number; role: "USER" | "ADMIN" };

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
  if (auth.role === "ADMIN") return true;

  const home = await prisma.home.findFirst({
    where: { id: homeId, ownerUserId: auth.id, deletedAt: null },
    select: { id: true },
  });

  return !!home;
}

export async function listHomeMembers(auth: AuthUser, homeId: number) {
  const ok = await canAccessHome(auth, homeId);
  if (!ok) return { error: "NOT_FOUND" as const };

  const members = await prisma.homeMember.findMany({
    where: { homeId, deletedAt: null },
    orderBy: [{ invitedAt: "desc" }],
    select: {
      homeId: true,
      userId: true,
      roleInHome: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
    },
  });

  return { members };
}

export async function addHomeMember(
  auth: AuthUser,
  homeId: number,
  input: { userId: number; roleInHome?: "OWNER" | "MEMBER" | "GUEST" },
) {
  const can = await canManageHome(auth, homeId);
  if (!can) return { error: "FORBIDDEN" as const };

  // ensure home exists
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: { id: true },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  // ensure user exists
  const u = await prisma.userAccount.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!u) return { error: "USER_NOT_FOUND" as const };

  // upsert-like: kalau pernah ada tapi deletedAt set, “revive”
  const existing = await prisma.homeMember.findFirst({
    where: { homeId, userId: input.userId },
  });

  const member = existing
    ? await prisma.homeMember.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          status: existing.status === "REVOKED" ? "INVITED" : existing.status,
          roleInHome: input.roleInHome ?? existing.roleInHome,
          invitedAt: new Date(),
          joinedAt: null,
        },
        select: {
          homeId: true,
          userId: true,
          roleInHome: true,
          status: true,
          invitedAt: true,
          joinedAt: true,
        },
      })
    : await prisma.homeMember.create({
        data: {
          homeId,
          userId: input.userId,
          roleInHome: input.roleInHome ?? "MEMBER",
          status: "INVITED",
          invitedAt: new Date(),
        },
        select: {
          homeId: true,
          userId: true,
          roleInHome: true,
          status: true,
          invitedAt: true,
          joinedAt: true,
        },
      });

  return { member };
}

export async function revokeHomeMember(
  auth: AuthUser,
  homeId: number,
  userId: number,
) {
  const can = await canManageHome(auth, homeId);
  if (!can) return { error: "FORBIDDEN" as const };

  const m = await prisma.homeMember.findFirst({
    where: { homeId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!m) return { error: "NOT_FOUND" as const };

  await prisma.homeMember.update({
    where: { id: m.id },
    data: { status: "REVOKED", deletedAt: new Date() },
  });

  return { ok: true as const };
}

export async function acceptHomeInvite(auth: AuthUser, homeId: number) {
  // user harus punya invitation (INVITED) yang masih aktif (deletedAt null)
  const m = await prisma.homeMember.findFirst({
    where: {
      homeId,
      userId: auth.id,
      deletedAt: null,
      status: "INVITED",
    },
    select: { id: true },
  });

  if (!m) return { error: "INVITE_NOT_FOUND" as const };

  const member = await prisma.homeMember.update({
    where: { id: m.id },
    data: {
      status: "ACTIVE",
      joinedAt: new Date(),
    },
    select: {
      homeId: true,
      userId: true,
      roleInHome: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
    },
  });

  return { member };
}
