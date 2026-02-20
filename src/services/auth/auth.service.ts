import argon2 from "argon2";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { signAccessToken } from "../../lib/jwt";
import { getClientIp } from "../../routes/v1/common/helpers";

type Role = "USER" | "ADMIN";

function nowPlusDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function randomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("base64url");
}

async function hashToken(token: string) {
  // argon2 already salts
  return argon2.hash(token);
}

async function verifyToken(hash: string, token: string) {
  return argon2.verify(hash, token);
}

export async function registerUser(
  c: any,
  input: {
    username: string;
    email: string;
    password: string;
    role?: Role;
    homeName?: string;
  },
) {
  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.userAccount
    .create({
      data: {
        username: input.username,
        email: input.email,
        password: passwordHash,
        role: input.role ?? "USER",
        // defaults: isActive=true
      },
    })
    .catch((e) => {
      if (String(e).toLowerCase().includes("unique")) return null;
      throw e;
    });

  if (!user) return { error: "ALREADY_EXISTS" as const };

  const home = input.homeName
    ? await prisma.home.create({
        data: {
          name: input.homeName,
          ownerUserId: user.id, // ✅ sesuai schema baru
        },
      })
    : null;

  // optional: record "success login history" only on login, not register
  return { user, home };
}

export async function loginUser(
  c: any,
  input: { username: string; password: string },
) {
  const ip = getClientIp(c);

  console.log("[AUTH] Login attempt:", {
    username: input.username,
    passwordLength: input.password.length,
    ip,
  });

  const user = await prisma.userAccount.findUnique({
    where: { username: input.username },
  });

  console.log("[AUTH] User found:", !!user);

  // record attempt (unknown username)
  if (!user) {
    console.log("[AUTH] User not found");
    await prisma.loginAttempt.create({
      data: {
        userId: null,
        usernameInput: input.username,
        ipAddress: ip,
        isSuccess: false,
        failReason: "USER_NOT_FOUND",
      },
    });
    return { error: "INVALID_CREDENTIALS" as const };
  }

  console.log("[AUTH] User details:", {
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    lockedUntil: user.lockedUntil,
    failedLoginCount: user.failedLoginCount,
  });

  // soft-delete / disabled guard
  if (!user.isActive || user.deletedAt) {
    console.log("[AUTH] User disabled or deleted");
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        usernameInput: input.username,
        ipAddress: ip,
        isSuccess: false,
        failReason: "USER_DISABLED_OR_DELETED",
      },
    });
    return { error: "INVALID_CREDENTIALS" as const };
  }

  // lockout guard
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        usernameInput: input.username,
        ipAddress: ip,
        isSuccess: false,
        failReason: "LOCKED",
      },
    });
    return {
      error: "LOCKED" as const,
      lockedUntil: user.lockedUntil.toISOString(),
    };
  }

  const ok = await argon2.verify(user.password, input.password);

  console.log("[AUTH] Password verification result:", ok);
  console.log("[AUTH] Hash from DB length:", user.password.length);
  console.log("[AUTH] Input password:", input.password);

  if (!ok) {
    const nextFailed = (user.failedLoginCount ?? 0) + 1;

    // contoh policy: lock 10 menit setelah 5 gagal
    const shouldLock = nextFailed >= 5;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + 10 * 60 * 1000)
      : null;

    await prisma.$transaction([
      prisma.userAccount.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextFailed,
          lockedUntil,
        },
      }),
      prisma.loginAttempt.create({
        data: {
          userId: user.id,
          usernameInput: input.username,
          ipAddress: ip,
          isSuccess: false,
          failReason: "BAD_PASSWORD",
        },
      }),
    ]);

    return { error: "INVALID_CREDENTIALS" as const };
  }

  // success: reset counters, record history
  await prisma.$transaction([
    prisma.userAccount.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.loginAttempt.create({
      data: {
        userId: user.id,
        usernameInput: input.username,
        ipAddress: ip,
        isSuccess: true,
        failReason: null,
      },
    }),
    prisma.loginHistory.create({
      data: { userId: user.id, ipAddress: ip },
    }),
  ]);

  // access token
  const accessToken = await signAccessToken(
    { sub: String(user.id), role: user.role as Role },
    "7d",
  );

  // refresh token session
  const refreshToken = randomToken(48);
  const refreshTokenHash = await hashToken(refreshToken);

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: c.req.header("user-agent") ?? null,
      ipAddress: ip,
      expiresAt: nowPlusDays(30), // refresh token 30 hari
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

export async function refreshAccessToken(input: {
  sessionId: number;
  refreshToken: string;
}) {
  const session = await prisma.userSession.findUnique({
    where: { id: input.sessionId },
    include: { user: true },
  });

  if (!session) return { error: "INVALID_SESSION" as const };
  if (session.revokedAt) return { error: "SESSION_REVOKED" as const };
  if (session.expiresAt.getTime() <= Date.now())
    return { error: "SESSION_EXPIRED" as const };
  if (session.user.deletedAt || !session.user.isActive)
    return { error: "USER_DISABLED" as const };

  const ok = await verifyToken(session.refreshTokenHash, input.refreshToken);
  if (!ok) return { error: "INVALID_SESSION" as const };

  const accessToken = await signAccessToken(
    { sub: String(session.userId), role: session.user.role as Role },
    "7d",
  );

  // optional rotate refresh token biar lebih aman
  const newRefreshToken = randomToken(48);
  const newHash = await hashToken(newRefreshToken);

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newHash,
      // keep expiresAt same, or extend sliding expiration if you want
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    sessionId: session.id,
    user: session.user,
  };
}

export async function logout(input: { sessionId: number }) {
  await prisma.userSession
    .update({
      where: { id: input.sessionId },
      data: { revokedAt: new Date() },
    })
    .catch(() => null);

  return { ok: true };
}

export async function getMe(userId: number) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return { error: "NOT_FOUND" as const };
  return { user };
}

export async function changePassword(
  userId: number,
  body: { oldPassword: string; newPassword: string },
) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return { error: "NOT_FOUND" as const };

  const ok = await argon2.verify(user.password, body.oldPassword);
  if (!ok) return { error: "INVALID_CREDENTIALS" as const };

  const newHash = await argon2.hash(body.newPassword);

  // update + revoke semua session
  await prisma.$transaction([
    prisma.userAccount.update({
      where: { id: userId },
      data: {
        password: newHash,
        passwordChangedAt: new Date(),
      },
    }),
    prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

export async function adminListUsers(limit = 50) {
  return prisma.userAccount.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function requestPasswordReset(input: { username: string }) {
  // biar aman: jangan bocorin user ada/tidak
  const user = await prisma.userAccount.findUnique({
    where: { username: input.username },
  });

  if (!user || user.deletedAt || !user.isActive) {
    return { ok: true };
  }

  const token = randomToken(32);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token, // token plaintext disimpan sesuai schema kamu (boleh ditingkatkan jadi hash nanti)
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 menit
    },
  });

  // TODO: kirim token via email / WA / dsb
  return { ok: true, token }; // kalau produksi: JANGAN return token, kirim lewat email
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}) {
  const pr = await prisma.passwordReset.findUnique({
    where: { token: input.token },
    include: { user: true },
  });

  if (!pr) return { error: "INVALID_TOKEN" as const };
  if (pr.usedAt) return { error: "TOKEN_USED" as const };
  if (pr.expiresAt.getTime() <= Date.now())
    return { error: "TOKEN_EXPIRED" as const };
  if (pr.user.deletedAt || !pr.user.isActive)
    return { error: "USER_DISABLED" as const };

  const newHash = await argon2.hash(input.newPassword);

  await prisma.$transaction([
    prisma.userAccount.update({
      where: { id: pr.userId },
      data: {
        password: newHash,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordReset.update({
      where: { id: pr.id },
      data: { usedAt: new Date() },
    }),
    prisma.userSession.updateMany({
      where: { userId: pr.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
