import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types/app-env";
import { registerAuthRoutes } from "./v1/auth/routes";
import { registerHomesRoutes } from "./v1/homes/routes";
import { registerDevicesRoutes } from "./v1/devices/routes";
import { registerDeviceHeartbeatRoutes } from "./v1/heartbeat/routes";
import { registerTelemetryRoutes } from "./v1/telemetry/routes";
import { registerCommandsRoutes } from "./v1/commands/routes";
import { registerEventsRoutes } from "./v1/events/routes";
import { registerAiRoutes } from "./v1/ai/routes";
import { registerNotificationRoutes } from "./v1/notifications/routes";

export function registerV1Routes(app: OpenAPIHono<AppEnv>) {
  registerAuthRoutes(app);
  registerHomesRoutes(app);
  registerDeviceHeartbeatRoutes(app);
  registerDevicesRoutes(app);
  registerTelemetryRoutes(app);
  registerCommandsRoutes(app);
  registerEventsRoutes(app);
  registerAiRoutes(app);
  registerNotificationRoutes(app);
}
