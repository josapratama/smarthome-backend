import { z } from "@hono/zod-openapi";
import { EndpointId, UserId } from "../common/ids";

export const NotificationEndpointCreateBody = z
  .object({
    channel: z
      .enum(["FCM", "MQTT", "WS", "SSE", "WEBHOOK", "CUSTOM"])
      .default("CUSTOM"),
    value: z.string().min(3).openapi({
      example:
        "mqtt://clientId-or-topic / https://example.com/webhook / random-token",
    }),
  })
  .openapi("NotificationEndpointCreateBody");

export const NotificationEndpointDTO = z
  .object({
    id: EndpointId,
    userId: UserId,
    channel: z.enum(["FCM", "MQTT", "WS", "SSE", "WEBHOOK", "CUSTOM"]),
    value: z.string(),
    createdAt: z.string(),
  })
  .openapi("NotificationEndpointDTO");
