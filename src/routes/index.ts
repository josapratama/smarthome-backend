import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types/app-env";
import { registerAuthRoutes } from "./v1/auth/routes";
import { registerOverviewRoutes } from "./v1/overview/routes";
import { registerHomesRoutes } from "./v1/homes/routes";
import { registerDevicesRoutes } from "./v1/devices/routes";
import { registerDeviceHeartbeatRoutes } from "./v1/heartbeat/routes";
import { registerTelemetryRoutes } from "./v1/telemetry/routes";
import { registerCommandsRoutes } from "./v1/commands/routes";
import { registerAlarmsRoutes } from "./v1/alarms/routes";
import { registerAiRoutes } from "./v1/ai/routes";
import { registerNotificationRoutes } from "./v1/notifications/routes";
import { registerFirmwareRoutes } from "./v1/firmware/routes";
import { registerOtaRoutes } from "./v1/ota/routes";
import { registerInviteRoutes } from "./v1/invites/routes";
import { registerRoomsRoutes } from "./v1/rooms/routes";
import { registerDeviceConfigRoutes } from "./v1/device-config/routes";

export function registerV1Routes(app: OpenAPIHono<AppEnv>) {
  registerOverviewRoutes(app);
  registerAuthRoutes(app);
  registerHomesRoutes(app);
  registerDeviceHeartbeatRoutes(app);
  registerDevicesRoutes(app);
  registerTelemetryRoutes(app);
  registerCommandsRoutes(app);
  registerAlarmsRoutes(app);
  registerAiRoutes(app);
  registerNotificationRoutes(app);
  registerFirmwareRoutes(app);
  registerOtaRoutes(app);
  registerInviteRoutes(app);
  registerRoomsRoutes(app);
  registerDeviceConfigRoutes(app);
}
