import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types/app-env";
import { verifyAccessToken } from "../lib/jwt";

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  // Try Authorization header first
  const auth = c.req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);

  // If no Authorization header, try cookie
  let token = m ? m[1] : null;
  if (!token) {
    token = getCookie(c, "access_token") ?? null;
  }

  if (!token) return c.json({ error: "UNAUTHORIZED" }, 401);

  try {
    const { userId, role } = await verifyAccessToken(token);
    if (!Number.isFinite(userId) || userId <= 0) throw new Error("BAD_TOKEN");

    c.set("auth", { user: { id: userId, role } });

    return await next();
  } catch {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }
}

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const a = c.get("auth");
  if (!a?.user || a.user.role !== "ADMIN")
    return c.json({ error: "FORBIDDEN" }, 403);

  return await next();
}
