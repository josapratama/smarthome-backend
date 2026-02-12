import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../lib/email";

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

export async function listHomeMembers(
  auth: AuthUser,
  homeId: number,
  page: { limit?: number; cursor?: number },
) {
  const ok = await canAccessHome(auth, homeId);
  if (!ok) return { error: "NOT_FOUND" as const };

  const take = Math.min(Math.max(page.limit ?? 20, 1), 100);
  const cursor = page.cursor;

  const members = await prisma.homeMember.findMany({
    where: { homeId, deletedAt: null },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    select: {
      homeId: true,
      userId: true,
      roleInHome: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
      id: true, // hanya untuk cursor internal
    },
  });

  const hasNext = members.length > take;
  const items = hasNext ? members.slice(0, take) : members;

  const nextCursor = hasNext ? items[items.length - 1]!.id : null;

  // buang id sebelum ke handler (handler ga butuh)
  const membersOut = items.map(({ id, ...rest }) => rest);

  return { members: membersOut, nextCursor };
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

  // safety: owner home tidak boleh direvoke
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: { ownerUserId: true },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  if (userId === home.ownerUserId) {
    return { error: "CANNOT_REVOKE_OWNER" as const };
  }

  // safety: owner tidak boleh revoke dirinya sendiri (redundant tapi jelas)
  if (auth.role !== "ADMIN" && userId === auth.id) {
    return { error: "CANNOT_REVOKE_SELF" as const };
  }

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

export async function getMyHomeMember(auth: AuthUser, homeId: number) {
  const member = await prisma.homeMember.findFirst({
    where: { homeId, userId: auth.id, deletedAt: null },
    select: {
      homeId: true,
      userId: true,
      roleInHome: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
    },
  });

  if (!member) return { error: "MEMBERSHIP_NOT_FOUND" as const };
  return { member };
}

export async function declineHomeInvite(auth: AuthUser, homeId: number) {
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

  await prisma.homeMember.update({
    where: { id: m.id },
    data: {
      status: "REVOKED",
      deletedAt: new Date(),
    },
  });

  return { ok: true as const };
}

export async function updateHomeMemberRole(
  auth: AuthUser,
  homeId: number,
  userId: number,
  roleInHome: "OWNER" | "MEMBER" | "GUEST",
) {
  const can = await canManageHome(auth, homeId);
  if (!can) return { error: "FORBIDDEN" as const };

  // Untuk simpel: jangan izinkan set OWNER via endpoint ini (hindari konflik ownerUserId).
  // Kalau kamu mau promote jadi owner, sebaiknya endpoint khusus yang juga update home.ownerUserId.
  if (roleInHome === "OWNER") return { error: "INVALID_ROLE_CHANGE" as const };

  const m = await prisma.homeMember.findFirst({
    where: { homeId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!m) return { error: "NOT_FOUND" as const };

  const member = await prisma.homeMember.update({
    where: { id: m.id },
    data: { roleInHome },
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

export async function resendHomeInvite(
  auth: AuthUser,
  homeId: number,
  userId: number,
) {
  const can = await canManageHome(auth, homeId);
  if (!can) return { error: "FORBIDDEN" as const };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  const member = await prisma.homeMember.findFirst({
    where: {
      homeId,
      userId,
      deletedAt: null,
      status: "INVITED",
    },
    select: { id: true },
  });
  if (!member) return { error: "INVITE_NOT_FOUND" as const };

  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { email: true, username: true },
  });
  if (!user) return { error: "USER_NOT_FOUND" as const };

  // refresh invitedAt
  await prisma.homeMember.update({
    where: { id: member.id },
    data: { invitedAt: new Date() },
  });

  // Email content minimal (tanpa link)
  // Kalau kamu punya URL frontend, kita bisa bikin accept link yang proper.
  const subject = `Undangan bergabung ke home: ${home.name}`;
  const text = [
    `Halo ${user.username},`,
    ``,
    `Kamu diundang untuk bergabung ke home: "${home.name}".`,
    ``,
    `Silakan buka aplikasi lalu pilih menu Undangan (Invitations) untuk menerima.`,
    ``,
    `Terima kasih.`,
  ].join("\n");

  await sendEmail({ to: user.email, subject, text });

  return { ok: true as const };
}
