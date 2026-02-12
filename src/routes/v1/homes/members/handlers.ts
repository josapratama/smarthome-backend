import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../../types/app-env";

import type {
  ListHomeMembersRoute,
  AddHomeMemberRoute,
  RevokeHomeMemberRoute,
  AcceptHomeInviteRoute,
  GetMyHomeMemberRoute,
  DeclineHomeInviteRoute,
  UpdateHomeMemberRoleRoute,
  ResendHomeInviteRoute,
} from "./openapi";

import {
  listHomeMembers,
  addHomeMember,
  revokeHomeMember,
  acceptHomeInvite,
  getMyHomeMember,
  declineHomeInvite,
  updateHomeMemberRole,
  resendHomeInvite,
} from "../../../../services/homes/home-members.service";

function toMemberDTO(m: {
  homeId: number;
  userId: number;
  roleInHome: "OWNER" | "MEMBER" | "GUEST";
  status: "INVITED" | "ACTIVE" | "REVOKED";
  invitedAt: Date;
  joinedAt: Date | null;
}) {
  return {
    homeId: m.homeId,
    userId: m.userId,
    roleInHome: m.roleInHome,
    status: m.status,
    invitedAt: m.invitedAt.toISOString(),
    joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
  };
}

export const handleListHomeMembers: RouteHandler<
  ListHomeMembersRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");
  const { limit, cursor } = c.req.valid("query");

  const res = await listHomeMembers(auth, homeId, { limit, cursor });
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json(
    { data: res.members.map(toMemberDTO), nextCursor: res.nextCursor },
    200,
  );
};

export const handleAddHomeMember: RouteHandler<
  AddHomeMemberRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await addHomeMember(auth, homeId, body);
  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.json({ data: toMemberDTO(res.member) }, 201);
};

export const handleRevokeHomeMember: RouteHandler<
  RevokeHomeMemberRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId, userId } = c.req.valid("param");

  const res = await revokeHomeMember(auth, homeId, userId);
  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    if (
      res.error === "CANNOT_REVOKE_OWNER" ||
      res.error === "CANNOT_REVOKE_SELF"
    )
      return c.json({ error: res.error }, 409);
    return c.json({ error: res.error }, 404);
  }

  return c.body(null, 204);
};

export const handleAcceptHomeInvite: RouteHandler<
  AcceptHomeInviteRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await acceptHomeInvite(auth, homeId);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: toMemberDTO(res.member) }, 200);
};

export const handleGetMyHomeMember: RouteHandler<
  GetMyHomeMemberRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await getMyHomeMember(auth, homeId);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: toMemberDTO(res.member) }, 200);
};

export const handleDeclineHomeInvite: RouteHandler<
  DeclineHomeInviteRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await declineHomeInvite(auth, homeId);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.body(null, 204);
};

export const handleUpdateHomeMemberRole: RouteHandler<
  UpdateHomeMemberRoleRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId, userId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await updateHomeMemberRole(auth, homeId, userId, body.roleInHome);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    if (res.error === "INVALID_ROLE_CHANGE")
      return c.json({ error: res.error }, 409);
    return c.json({ error: res.error }, 404);
  }

  return c.json({ data: toMemberDTO(res.member) }, 200);
};

export const handleResendHomeInvite: RouteHandler<
  ResendHomeInviteRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId, userId } = c.req.valid("param");

  const res = await resendHomeInvite(auth, homeId, userId);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.body(null, 204);
};
