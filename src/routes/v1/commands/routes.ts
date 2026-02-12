import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

import { createCommandRoute, getCommandRoute } from "./openapi";
import { handleCreateCommand, handleGetCommand } from "./handlers";

export function registerCommandsRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // recommended: commands harus auth
  r.use("/*", requireAuth);

  r.openapi(createCommandRoute, handleCreateCommand);
  r.openapi(getCommandRoute, handleGetCommand);

  app.route("/", r);
}
