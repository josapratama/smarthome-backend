import type { Context } from "hono";
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

export async function handleRegister(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await registerUser(c, body);
  if ("error" in res) return c.json({ error: res.error }, 409);
  return c.json({ data: res }, 201);
}

export async function handleLogin(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await loginUser(c, body);
  if ("error" in res) return c.json(res, 401);

  return c.json({
    data: {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
      user: res.user,
    },
  });
}

export async function handleRefresh(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await refreshAccessToken(body);
  if ("error" in res) return c.json(res, 401);

  return c.json({
    data: {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
      user: res.user,
    },
  });
}

export async function handleLogout(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await logout(body);
  return c.json({ data: res });
}

export async function handleMe(c: Context<AppEnv>) {
  const a = c.get("auth");
  const res = await getMe(a.user.id);
  if ("error" in res) return c.json(res, 404);
  return c.json({ data: res.user });
}

export async function handleChangePassword(c: Context<AppEnv>) {
  const a = c.get("auth");
  const body = await c.req.json();
  const res = await changePassword(a.user.id, body);
  if ("error" in res) return c.json(res, 400);
  return c.json({ data: res });
}

export async function handleForgotPassword(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await requestPasswordReset(body);
  return c.json({ data: res }); // produksi: jangan return token
}

export async function handleResetPassword(c: Context<AppEnv>) {
  const body = await c.req.json();
  const res = await resetPassword(body);
  if ("error" in res) return c.json(res, 400);
  return c.json({ data: res });
}

export async function handleAdminListUsers(c: Context<AppEnv>) {
  const limit = Number(c.req.query("limit") ?? "50");
  const users = await adminListUsers(limit);
  return c.json({ data: users });
}
