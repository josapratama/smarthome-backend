import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import { createCommandRoute, getCommandRoute } from "./openapi";
import { handleCreateCommand, handleGetCommand } from "./handlers";

export function registerCommandsRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // Admin only access for command management
  r.use("/*", requireAuth, requireAdmin);

  r.openapi(createCommandRoute, handleCreateCommand);
  r.openapi(getCommandRoute, handleGetCommand);

  app.route("/", r);
}
