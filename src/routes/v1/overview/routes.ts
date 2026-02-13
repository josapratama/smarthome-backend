import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  dashboardRoute,
  homeAttentionRoute,
  homeOverviewRoute,
} from "./openapi";
import {
  handleDashboard,
  handleHomeAttention,
  handleHomeOverview,
} from "./handlers";

export function registerOverviewRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("*", requireAuth, requireAdmin);

  r.openapi(dashboardRoute, handleDashboard);
  r.openapi(homeOverviewRoute, handleHomeOverview);
  r.openapi(homeAttentionRoute, handleHomeAttention);

  app.route("/", r);
}
