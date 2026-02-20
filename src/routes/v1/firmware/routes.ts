import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  firmwareListReleasesRoute,
  firmwareUploadReleaseRoute,
} from "./openapi";

import {
  handleFirmwareListReleases,
  handleFirmwareUploadRelease,
} from "./handlers";

export function registerFirmwareRoutes(app: OpenAPIHono<AppEnv>) {
  // Public download route - PLAIN HONO (no OpenAPI, no auth)
  // This must be registered BEFORE the protected routes to avoid auth middleware
  app.get("/api/v1/firmware/releases/:id/download", async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const { FirmwareService } =
        await import("../../../services/firmware/firmware.service");
      const res = await FirmwareService.getDownloadResponse(id);
      return res;
    } catch (e: any) {
      return c.json({ error: e?.message ?? "NOT_FOUND" }, 404);
    }
  });

  // Protected routes - require auth and admin
  // Create a separate router for protected endpoints
  const r = new OpenAPIHono<AppEnv>();

  // Apply auth middleware only to these specific routes
  r.use("/api/v1/firmware/releases", requireAuth, requireAdmin);

  r.openapi(firmwareListReleasesRoute, handleFirmwareListReleases);
  r.openapi(firmwareUploadReleaseRoute, handleFirmwareUploadRelease);

  // Mount the protected router
  app.route("/", r);
}
