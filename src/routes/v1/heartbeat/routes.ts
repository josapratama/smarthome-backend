import { z, createRoute } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import { requireDeviceKey } from "../../../middlewares/device-auth";
import { postHeartbeatHandler } from "./handlers";
import {
  DeviceKeyHeaderSchema,
  ErrorResponseSchema,
  HeartbeatBodySchema,
  HeartbeatParamsSchema,
  HeartbeatResponseSchema,
} from "./schemas";

const InvalidDeviceIdSchema = z.object({
  error: z.literal("INVALID_DEVICE_ID"),
});

export function registerDeviceHeartbeatRoutes(app: OpenAPIHono<AppEnv>) {
  app.use("/api/v1/devices/:deviceId/heartbeat", async (c, next) => {
    const deviceId = Number(c.req.param("deviceId"));
    if (!Number.isFinite(deviceId)) {
      return c.json({ error: "INVALID_DEVICE_ID" }, 422);
    }
    return requireDeviceKey(c, next, deviceId);
  });

  const route = createRoute({
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
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      422: {
        description: "Invalid deviceId",
        content: { "application/json": { schema: InvalidDeviceIdSchema } },
      },
    },
    tags: ["Devices"],
  });

  app.openapi(route, postHeartbeatHandler);
}
