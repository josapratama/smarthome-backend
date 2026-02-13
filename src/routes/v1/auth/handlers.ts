import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  resetPassword,
  adminListUsers,
} from "../../../services/auth/auth.service";

import type {
  RegisterRoute,
  LoginRoute,
  RefreshRoute,
  LogoutRoute,
  MeRoute,
  ChangePasswordRoute,
  ForgotPasswordRoute,
  ResetPasswordRoute,
  AdminListUsersRoute,
} from "./openapi";

import { toHomeDTO, toUserDTO } from "../../../services/auth/auth.dto";

export const handleRegister: RouteHandler<RegisterRoute, AppEnv> = async (
  c,
) => {
  const body = c.req.valid("json");
  const res = await registerUser(c, body);
  if ("error" in res) return c.json({ error: res.error }, 409);

  return c.json(
    {
      data: {
        user: toUserDTO(res.user),
        home: res.home ? toHomeDTO(res.home) : null,
      },
    },
    201,
  );
};

export const handleLogin: RouteHandler<LoginRoute, AppEnv> = async (c) => {
  const body = c.req.valid("json");
  const res = await loginUser(c, body);
  if ("error" in res) return c.json(res, 401);

  return c.json({
    data: {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
      user: toUserDTO(res.user),
    },
  });
};

export const handleRefresh: RouteHandler<RefreshRoute, AppEnv> = async (c) => {
  const body = c.req.valid("json");
  const res = await refreshAccessToken(body);
  if ("error" in res) return c.json(res, 401);

  return c.json({
    data: {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
      user: toUserDTO(res.user),
    },
  });
};

export const handleLogout: RouteHandler<LogoutRoute, AppEnv> = async (c) => {
  const body = c.req.valid("json");
  await logout(body);
  return c.json({ data: { ok: true } });
};

export const handleMe: RouteHandler<MeRoute, AppEnv> = async (c) => {
  const a = c.get("auth");
  const res = await getMe(a.user.id);
  if ("error" in res) return c.json(res, 404);
  return c.json({ data: toUserDTO(res.user) });
};

export const handleChangePassword: RouteHandler<
  ChangePasswordRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const body = c.req.valid("json");
  const res = await changePassword(a.user.id, body);
  if ("error" in res) return c.json(res, 400);
  return c.json({ data: { ok: true } });
};

export const handleForgotPassword: RouteHandler<
  ForgotPasswordRoute,
  AppEnv
> = async (c) => {
  const body = c.req.valid("json");
  const res = await requestPasswordReset(body);

  // Produksi: jangan kirim token
  // Kalau mau aman tanpa flag env: cukup return ok saja di handler.
  return c.json({ data: res });
};

export const handleResetPassword: RouteHandler<
  ResetPasswordRoute,
  AppEnv
> = async (c) => {
  const body = c.req.valid("json");
  const res = await resetPassword(body);
  if ("error" in res) return c.json(res, 400);
  return c.json({ data: { ok: true } });
};

export const handleAdminListUsers: RouteHandler<
  AdminListUsersRoute,
  AppEnv
> = async (c) => {
  const q = c.req.valid("query");
  const limit = Number(q.limit ?? "50");
  const users = await adminListUsers(limit);

  // Kalau adminListUsers sudah pakai select minimal fields, ini aman.
  // Kalau belum, jangan pakai ...u (bisa kebocoran password).
  return c.json({
    data: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  });
};
