import { z } from "@hono/zod-openapi";
import { EndpointId, UserId } from "../common/ids";

export const NotificationChannelEnum = z.enum([
  "FCM",
  "MQTT",
  "WS",
  "SSE",
  "WEBHOOK",
  "CUSTOM",
]);

export const NotificationEndpointCreateBody = z
  .object({
    channel: NotificationChannelEnum.default("CUSTOM"),
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
    channel: NotificationChannelEnum,
    value: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi("NotificationEndpointDTO");

export const NotificationEndpointListResponse = z
  .object({ data: z.array(NotificationEndpointDTO) })
  .openapi("NotificationEndpointListResponse");

export const NotificationEndpointCreateResponse = z
  .object({ data: NotificationEndpointDTO })
  .openapi("NotificationEndpointCreateResponse");

export const ErrorResponse = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");
