import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

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

  // alarms seharusnya auth (karena ada ack/resolve by user)
  r.use("/*", requireAuth);

  r.openapi(listHomeAlarmsRoute, handleListHomeAlarms);
  r.openapi(createHomeAlarmRoute, handleCreateHomeAlarm);
  r.openapi(ackAlarmRoute, handleAckAlarm);
  r.openapi(resolveAlarmRoute, handleResolveAlarm);

  app.route("/", r);
}
