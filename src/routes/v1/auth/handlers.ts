import argon2 from "argon2";
import { prisma } from "../../../lib/prisma";
import { getClientIp } from "../common/helpers";

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
  homeName?: string;
}) {
  // Hash password pakai argon2
  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.userAccount
    .create({
      data: {
        username: input.username,
        email: input.email,
        // field kamu namanya "password" (isinya hash)
        password: passwordHash,
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

  // verify password dengan hash yang tersimpan di field "password"
  const ok = await argon2.verify(user.password, input.password);
  if (!ok) return { error: "INVALID_CREDENTIALS" as const };

  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      ipAddress: getClientIp(c),
    },
  });

  return { user };
}
