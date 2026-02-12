import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { acceptInviteRoute } from "./openapi";
import { handleAcceptInvite } from "./handlers";

export function registerInviteRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();
  r.openapi(acceptInviteRoute, handleAcceptInvite);

  // mounted on root app, so full path becomes /invites/{token}
  app.route("/", r);
}
