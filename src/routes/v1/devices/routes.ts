import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  devicesListRoute,
  devicesCreateUnderHomeRoute,
  devicesGetByIdRoute,
  devicesPatchRoute,
} from "./openapi";

import {
  handleDevicesList,
  handleDevicesCreateUnderHome,
  handleDevicesGetById,
  handleDevicesPatch,
} from "./handlers";

export function registerDevicesRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("/*", requireAuth, requireAdmin);

  r.openapi(devicesListRoute, handleDevicesList);
  r.openapi(devicesCreateUnderHomeRoute, handleDevicesCreateUnderHome);
  r.openapi(devicesGetByIdRoute, handleDevicesGetById);
  r.openapi(devicesPatchRoute, handleDevicesPatch);

  app.route("/", r);
}
