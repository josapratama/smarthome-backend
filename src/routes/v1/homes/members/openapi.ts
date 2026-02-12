import { createRoute, z } from "@hono/zod-openapi";
import { HomeId, UserId } from "../../common/ids";
import { AddMemberBody, HomeMemberDTO } from "./schemas";

export const listHomeMembersRoute = createRoute({
  method: "get",
  path: "/{homeId}/members",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(HomeMemberDTO) }),
        },
      },
      description: "List home members (owner/member/admin).",
    },
    404: { description: "Not found" },
  },
});

export const addHomeMemberRoute = createRoute({
  method: "post",
  path: "/{homeId}/members",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: AddMemberBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description: "Invite/add member (owner/admin).",
    },
    403: { description: "Forbidden" },
    404: { description: "Home/User not found" },
  },
});

export const revokeHomeMemberRoute = createRoute({
  method: "delete",
  path: "/{homeId}/members/{userId}",
  request: { params: z.object({ homeId: HomeId, userId: UserId }) },
  responses: {
    204: { description: "Revoked" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
});

export const acceptHomeInviteRoute = createRoute({
  method: "post",
  path: "/{homeId}/members/accept",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description:
        "Accept invitation for the authenticated user (INVITED -> ACTIVE).",
    },
    404: { description: "Invitation not found" },
  },
});

export const getMyHomeMemberRoute = createRoute({
  method: "get",
  path: "/{homeId}/members/me",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description:
        "Get membership status for the authenticated user in a home.",
    },
    404: { description: "Membership not found" },
  },
});

export const declineHomeInviteRoute = createRoute({
  method: "post",
  path: "/{homeId}/members/decline",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    204: { description: "Declined invitation (INVITED -> REVOKED)" },
    404: { description: "Invitation not found" },
  },
});

export type DeclineHomeInviteRoute = typeof declineHomeInviteRoute;
export type GetMyHomeMemberRoute = typeof getMyHomeMemberRoute;
export type AcceptHomeInviteRoute = typeof acceptHomeInviteRoute;
export type ListHomeMembersRoute = typeof listHomeMembersRoute;
export type AddHomeMemberRoute = typeof addHomeMemberRoute;
export type RevokeHomeMemberRoute = typeof revokeHomeMemberRoute;
