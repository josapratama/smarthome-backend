import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

import { getDeviceConfigRoute, upsertDeviceConfigRoute } from "./openapi";
import { handleGetDeviceConfig, handleUpsertDeviceConfig } from "./handlers";

export function registerDeviceConfigRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("/*", requireAuth);

  r.openapi(getDeviceConfigRoute, handleGetDeviceConfig);
  r.openapi(upsertDeviceConfigRoute, handleUpsertDeviceConfig);

  app.route("/", r);
}
