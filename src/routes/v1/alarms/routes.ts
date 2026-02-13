import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  listHomeAlarmsRoute,
  createHomeAlarmRoute,
  ackAlarmRoute,
  resolveAlarmRoute,
} from "./openapi";

import {
  handleListHomeAlarms,
  handleCreateHomeAlarm,
  handleAckAlarm,
  handleResolveAlarm,
} from "./handlers";

export function registerAlarmsRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Admin only access for alarm management
  r.use("/*", requireAuth, requireAdmin);

  r.openapi(listHomeAlarmsRoute, handleListHomeAlarms);
  r.openapi(createHomeAlarmRoute, handleCreateHomeAlarm);
  r.openapi(ackAlarmRoute, handleAckAlarm);
  r.openapi(resolveAlarmRoute, handleResolveAlarm);

  app.route("/", r);
}
