import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  firmwareListReleasesRoute,
  firmwareUploadReleaseRoute,
  firmwareDownloadReleaseRoute,
} from "./openapi";

import {
  handleFirmwareListReleases,
  handleFirmwareUploadRelease,
  handleFirmwareDownloadRelease,
} from "./handlers";

export function registerFirmwareRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Admin only access for firmware management
  r.use("/*", requireAuth, requireAdmin);

  r.openapi(firmwareListReleasesRoute, handleFirmwareListReleases);
  r.openapi(firmwareUploadReleaseRoute, handleFirmwareUploadRelease);
  r.openapi(firmwareDownloadReleaseRoute, handleFirmwareDownloadRelease);

  app.route("/", r);
}
