import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { UserId } from "../common/ids";
import {
  NotificationEndpointCreateBody,
  NotificationEndpointDTO,
} from "./schemas";
import { listEndpoints, createEndpoint, mapEndpointDTO } from "./handlers";

export function registerNotificationRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/users/{userId}/notification-endpoints",
      request: { params: z.object({ userId: UserId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(NotificationEndpointDTO) }),
            },
          },
          description: "List notification endpoints for a user.",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("param");
      const rows = await listEndpoints(userId);
      return c.json({ data: rows.map(mapEndpointDTO) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/users/{userId}/notification-endpoints",
      request: {
        params: z.object({ userId: UserId }),
        body: {
          content: {
            "application/json": { schema: NotificationEndpointCreateBody },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({ data: NotificationEndpointDTO }),
            },
          },
          description:
            "Create a notification endpoint (FCM/MQTT/WS/SSE/WEBHOOK/etc).",
        },
        404: { description: "User not found" },
        409: { description: "Endpoint value already exists" },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createEndpoint(userId, body);
      if ("error" in res) {
        if (res.error === "USER_NOT_FOUND")
          return c.json({ error: res.error }, 404);
        return c.json({ error: res.error }, 409);
      }

      return c.json({ data: mapEndpointDTO(res.row) }, 201);
    },
  );
}
