import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

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

  r.use("*", requireAuth);

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
