import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  devicesListRoute,
  devicesCreateUnderHomeRoute,
  devicesGetByIdRoute,
  devicesPatchRoute,
  devicesDeleteRoute,
} from "./openapi";

import {
  handleDevicesList,
  handleDevicesCreateUnderHome,
  handleDevicesGetById,
  handleDevicesPatch,
  handleDevicesDelete,
} from "./handlers";

export function registerDevicesRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("/*", requireAuth, requireAdmin);

  r.openapi(devicesListRoute, handleDevicesList);
  r.openapi(devicesCreateUnderHomeRoute, handleDevicesCreateUnderHome);
  r.openapi(devicesGetByIdRoute, handleDevicesGetById);
  r.openapi(devicesPatchRoute, handleDevicesPatch);
  r.openapi(devicesDeleteRoute, handleDevicesDelete);

  app.route("/", r);
}
