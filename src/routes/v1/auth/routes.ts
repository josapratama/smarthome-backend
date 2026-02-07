import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import { requireAuth, requireAdmin } from "../../../middlewares/auth";
import {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  adminListUsers,
} from "./handlers";
import {
  RegisterBody,
  LoginBody,
  UserDTO,
  AuthLoginResponse,
  ChangePasswordBody,
} from "./schemas";

export function registerAuthRoutes(app: OpenAPIHono<AppEnv>) {
  // POST /api/v1/auth/register
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/register",
      request: {
        body: { content: { "application/json": { schema: RegisterBody } } },
      },
      responses: {
        201: {
          description: "Register user (optional: create first home).",
          content: {
            "application/json": {
              schema: z.object({
                data: z.object({
                  user: UserDTO,
                  home: z
                    .object({
                      id: z.number().int(),
                      name: z.string(),
                      ownerId: z.number().int(),
                      createdAt: z.string(),
                      updatedAt: z.string(),
                    })
                    .nullable(),
                }),
              }),
            },
          },
        },
        409: { description: "Username/email already exists" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const res = await registerUser(body);
      if ("error" in res) return c.json({ error: res.error }, 409);

      return c.json(
        {
          data: {
            user: {
              id: res.user.id,
              username: res.user.username,
              email: res.user.email,
              role: res.user.role,
              createdAt: res.user.createdAt.toISOString(),
            },
            home: res.home
              ? {
                  id: res.home.id,
                  name: res.home.name,
                  ownerId: res.home.ownerId,
                  createdAt: res.home.createdAt.toISOString(),
                  updatedAt: res.home.updatedAt.toISOString(),
                }
              : null,
          },
        },
        201,
      );
    },
  );

  // POST /api/v1/auth/login
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/login",
      request: {
        body: { content: { "application/json": { schema: LoginBody } } },
      },
      responses: {
        200: {
          description: "Login",
          content: { "application/json": { schema: AuthLoginResponse } },
        },
        401: { description: "Invalid credentials" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const res = await loginUser(c, body);
      if ("error" in res) return c.json({ error: res.error }, 401);

      return c.json({
        data: {
          accessToken: res.accessToken,
          user: {
            id: res.user.id,
            username: res.user.username,
            email: res.user.email,
            role: res.user.role,
            createdAt: res.user.createdAt.toISOString(),
          },
        },
      });
    },
  );

  // GET /api/v1/auth/me
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/auth/me",
      responses: {
        200: {
          description: "Current user",
          content: {
            "application/json": { schema: z.object({ data: UserDTO }) },
          },
        },
        401: { description: "Unauthorized" },
      },
    }),
    async (c) => {
      const authRes = await requireAuth(c, async () => {});
      if (authRes) return authRes;

      const auth = c.get("auth"); // ✅ tidak pernah 'never'
      const res = await getMe(auth.user.id);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({
        data: {
          id: res.user.id,
          username: res.user.username,
          email: res.user.email,
          role: res.user.role,
          createdAt: res.user.createdAt.toISOString(),
        },
      });
    },
  );

  // POST /api/v1/auth/change-password
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/change-password",
      request: {
        body: {
          content: { "application/json": { schema: ChangePasswordBody } },
        },
      },
      responses: {
        200: {
          description: "Password changed",
          content: {
            "application/json": { schema: z.object({ ok: z.boolean() }) },
          },
        },
        401: { description: "Unauthorized / invalid credentials" },
      },
    }),
    async (c) => {
      const authRes = await requireAuth(c, async () => {});
      if (authRes) return authRes;

      const body = c.req.valid("json");
      const auth = c.get("auth");

      const res = await changePassword(auth.user.id, body);
      if ("error" in res) return c.json({ error: res.error }, 401);

      return c.json({ ok: true });
    },
  );

  // GET /api/v1/admin/users?limit=50
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/admin/users",
      request: {
        query: z.object({
          limit: z.coerce.number().int().min(1).max(500).default(50),
        }),
      },
      responses: {
        200: {
          description: "List users (ADMIN only)",
          content: {
            "application/json": {
              schema: z.object({ data: z.array(UserDTO) }),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    }),
    async (c) => {
      const authRes = await requireAuth(c, async () => {});
      if (authRes) return authRes;

      const adminRes = await requireAdmin(c, async () => {});
      if (adminRes) return adminRes;

      const { limit } = c.req.valid("query");
      const users = await adminListUsers(limit);

      return c.json({
        data: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
        })),
      });
    },
  );
}
