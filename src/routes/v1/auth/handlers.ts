import argon2 from "argon2";
import { prisma } from "../../../lib/prisma";
import { getClientIp } from "../common/helpers";
import { signAccessToken } from "../../../lib/jwt";

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
  homeName?: string;
}) {
  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.userAccount
    .create({
      data: {
        username: input.username,
        email: input.email,
        password: passwordHash, // <-- field kamu
        role: input.role,
      },
    })
    .catch((e) => {
      if (String(e).toLowerCase().includes("unique")) return null;
      throw e;
    });

  if (!user) return { error: "ALREADY_EXISTS" as const };

  const home = input.homeName
    ? await prisma.home.create({
        data: { name: input.homeName, ownerId: user.id },
      })
    : null;

  return { user, home };
}

export async function loginUser(
  c: any,
  input: { identifier: string; password: string },
) {
  const user = await prisma.userAccount.findFirst({
    where: {
      OR: [{ email: input.identifier }, { username: input.identifier }],
    },
  });
  if (!user) return { error: "INVALID_CREDENTIALS" as const };

  const ok = await argon2.verify(user.password, input.password);
  if (!ok) return { error: "INVALID_CREDENTIALS" as const };

  await prisma.loginHistory.create({
    data: { userId: user.id, ipAddress: getClientIp(c) },
  });

  const accessToken = await signAccessToken(
    { sub: String(user.id), role: user.role },
    "7d",
  );

  return { user, accessToken };
}

export async function getMe(userId: number) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user) return { error: "NOT_FOUND" as const };
  return { user };
}

export async function changePassword(
  userId: number,
  body: { oldPassword: string; newPassword: string },
) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user) return { error: "NOT_FOUND" as const };

  const ok = await argon2.verify(user.password, body.oldPassword);
  if (!ok) return { error: "INVALID_CREDENTIALS" as const };

  const newHash = await argon2.hash(body.newPassword);
  await prisma.userAccount.update({
    where: { id: userId },
    data: { password: newHash },
  });

  return { ok: true };
}

export async function adminListUsers(limit = 50) {
  const users = await prisma.userAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
  return users;
}
