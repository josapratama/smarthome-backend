import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  triggerOtaRoute,
  listDeviceOtaJobsRoute,
  getOtaJobRoute,
} from "./openapi";
import {
  handleTriggerOta,
  handleListDeviceOtaJobs,
  handleGetOtaJob,
} from "./handlers";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

export function registerOtaRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Admin only access for OTA management
  r.use("/*", requireAuth, requireAdmin);

  r.openapi(triggerOtaRoute, handleTriggerOta);
  r.openapi(listDeviceOtaJobsRoute, handleListDeviceOtaJobs);
  r.openapi(getOtaJobRoute, handleGetOtaJob);

  app.route("/", r);
}
