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
  summary: "Device heartbeat/handshake",
  description:
    "Update device status=true dan lastSeenAt=now. Jika mqttClientId dikirim, akan disimpan ke device.mqttClientId.",
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
      description: "OK",
      content: { "application/json": { schema: HeartbeatResponseSchema } },
    },
    401: {
      description: "Unauthorized (missing/wrong x-device-key)",
      content: { "application/json": { schema: DeviceAuthErrorSchema } },
    },
    404: {
      description: "Device not found",
      content: { "application/json": { schema: DeviceAuthErrorSchema } },
    },
  },
  tags: ["Devices"],
});
export type HeartbeatRoute = typeof heartbeatRoute;
