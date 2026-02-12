import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireDeviceKey } from "../../../middlewares/device-auth";

import { heartbeatRoute } from "./openapi";
import { handleHeartbeat } from "./handlers";

export function registerDeviceHeartbeatRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Middleware untuk auth device-key
  r.use("/api/v1/devices/:deviceId/heartbeat", async (c, next) => {
    const deviceId = Number(c.req.param("deviceId"));
    if (!Number.isFinite(deviceId) || deviceId <= 0) {
      return c.json({ error: "INVALID_DEVICE_ID" }, 422);
    }
    return requireDeviceKey(c, next, deviceId);
  });

  r.openapi(heartbeatRoute, handleHeartbeat);

  app.route("/", r);
}
