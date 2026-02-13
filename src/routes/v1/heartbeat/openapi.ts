import { createRoute, z } from "@hono/zod-openapi";
import {
  DeviceKeyHeaderSchema,
  DeviceAuthErrorSchema,
  HeartbeatBodySchema,
  HeartbeatParamsSchema,
  HeartbeatResponseSchema,
} from "./schemas";

export const heartbeatRoute = createRoute({
  method: "post",
  path: "/api/v1/devices/{deviceId}/heartbeat",
  summary: "Send device heartbeat",
  description:
    "Update device status to online and record last seen timestamp. Optionally update MQTT client ID if provided.",
  request: {
    params: HeartbeatParamsSchema,
    headers: DeviceKeyHeaderSchema,
    body: {
      required: false,
      content: { "application/json": { schema: HeartbeatBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Heartbeat received successfully",
      content: { "application/json": { schema: HeartbeatResponseSchema } },
    },
    401: {
      description: "Unauthorized - missing or invalid device key",
      content: { "application/json": { schema: DeviceAuthErrorSchema } },
    },
    404: {
      description: "Device not found",
      content: { "application/json": { schema: DeviceAuthErrorSchema } },
    },
  },
  tags: ["Device Management"],
});
export type HeartbeatRoute = typeof heartbeatRoute;
