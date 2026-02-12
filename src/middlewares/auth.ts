import type { Context, Next } from "hono";
import type { AppEnv } from "../types/app-env";
import { verifyAccessToken } from "../lib/jwt";

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const auth = c.req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return c.json({ error: "UNAUTHORIZED" }, 401);

  try {
    const { userId, role } = await verifyAccessToken(m[1]);
    if (!Number.isFinite(userId) || userId <= 0) throw new Error("BAD_TOKEN");
    c.set("auth", { user: { id: userId, role } });
    await next();
  } catch {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }
}

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const a = c.get("auth");
  if (!a?.user || a.user.role !== "ADMIN")
    return c.json({ error: "FORBIDDEN" }, 403);
  await next();
}
