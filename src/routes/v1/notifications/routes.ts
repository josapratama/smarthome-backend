import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  listMyNotificationEndpointsRoute,
  createMyNotificationEndpointRoute,
  deleteMyNotificationEndpointRoute,
} from "./openapi";

import {
  handleListMyNotificationEndpoints,
  handleCreateMyNotificationEndpoint,
  handleDeleteMyNotificationEndpoint,
} from "./handlers";

export function registerNotificationRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Admin only access for notification management
  r.use("*", requireAuth, requireAdmin);

  r.openapi(
    listMyNotificationEndpointsRoute,
    handleListMyNotificationEndpoints,
  );
  r.openapi(
    createMyNotificationEndpointRoute,
    handleCreateMyNotificationEndpoint,
  );
  r.openapi(
    deleteMyNotificationEndpointRoute,
    handleDeleteMyNotificationEndpoint,
  );

  app.route("/", r);
}
