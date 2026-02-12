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

export type ListHomeMembersRoute = typeof listHomeMembersRoute;
export type AddHomeMemberRoute = typeof addHomeMemberRoute;
export type RevokeHomeMemberRoute = typeof revokeHomeMemberRoute;
