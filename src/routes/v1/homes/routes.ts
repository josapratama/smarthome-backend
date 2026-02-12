import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

import {
  listHomesRoute,
  createHomeRoute,
  getHomeRoute,
  updateHomeRoute,
  deleteHomeRoute,
  restoreHomeRoute,
} from "./openapi";

import {
  handleListHomes,
  handleCreateHome,
  handleGetHome,
  handleUpdateHome,
  handleDeleteHome,
  handleRestoreHome,
} from "./handlers";

export function registerHomesRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("*", requireAuth);

  r.openapi(listHomesRoute, handleListHomes);
  r.openapi(createHomeRoute, handleCreateHome);
  r.openapi(getHomeRoute, handleGetHome);
  r.openapi(updateHomeRoute, handleUpdateHome);
  r.openapi(deleteHomeRoute, handleDeleteHome);
  r.openapi(restoreHomeRoute, handleRestoreHome);

  app.route("/", r);
}
