import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { registerUser, loginUser } from "./handlers";
import { RegisterBody, LoginBody, UserDTO, HomeDTO } from "./schemas";

export function registerAuthRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/register",
      request: {
        body: { content: { "application/json": { schema: RegisterBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({
                data: z.object({ user: UserDTO, home: HomeDTO.nullable() }),
              }),
            },
          },
          description: "Register user (optional: create first home).",
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

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/login",
      request: {
        body: { content: { "application/json": { schema: LoginBody } } },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.object({ user: UserDTO }) }),
            },
          },
          description: "Login (writes login_history).",
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
}
