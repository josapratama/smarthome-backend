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

import {
  listHomeMembersRoute,
  addHomeMemberRoute,
  revokeHomeMemberRoute,
  acceptHomeInviteRoute,
  getMyHomeMemberRoute,
  declineHomeInviteRoute,
} from "./members/openapi";

import {
  handleListHomeMembers,
  handleAddHomeMember,
  handleRevokeHomeMember,
  handleAcceptHomeInvite,
  handleGetMyHomeMember,
  handleDeclineHomeInvite,
} from "./members/handlers";

export function registerHomesRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("*", requireAuth);

  r.openapi(listHomesRoute, handleListHomes);
  r.openapi(createHomeRoute, handleCreateHome);
  r.openapi(getHomeRoute, handleGetHome);
  r.openapi(updateHomeRoute, handleUpdateHome);
  r.openapi(deleteHomeRoute, handleDeleteHome);
  r.openapi(restoreHomeRoute, handleRestoreHome);

  r.openapi(listHomeMembersRoute, handleListHomeMembers);
  r.openapi(addHomeMemberRoute, handleAddHomeMember);
  r.openapi(revokeHomeMemberRoute, handleRevokeHomeMember);
  r.openapi(acceptHomeInviteRoute, handleAcceptHomeInvite);
  r.openapi(getMyHomeMemberRoute, handleGetMyHomeMember);
  r.openapi(declineHomeInviteRoute, handleDeclineHomeInvite);

  app.route("/", r);
}
