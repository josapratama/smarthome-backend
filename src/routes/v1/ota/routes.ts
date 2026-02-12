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
import { requireAuth } from "../../../middlewares/auth";

export function registerOtaRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // kalau mau protect, uncomment:
  r.use("/*", requireAuth);

  r.openapi(triggerOtaRoute, handleTriggerOta);
  r.openapi(listDeviceOtaJobsRoute, handleListDeviceOtaJobs);
  r.openapi(getOtaJobRoute, handleGetOtaJob);

  app.route("/", r);
}
