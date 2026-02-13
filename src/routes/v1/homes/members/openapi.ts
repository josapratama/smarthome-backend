import { createRoute, z } from "@hono/zod-openapi";
import { HomeId, UserId } from "../../common/ids";
import {
  AddMemberBody,
  HomeMemberDTO,
  MembersPaginationQuery,
  HomeMembersListResponse,
  UpdateMemberRoleBody,
} from "./schemas";

export const listHomeMembersRoute = createRoute({
  method: "get",
  path: "/api/v1/{homeId}/members",
  summary: "List home members",
  description:
    "Retrieve all members of a home including their roles, status, and invitation details. Supports cursor-based pagination.",
  request: {
    params: z.object({ homeId: HomeId }),
    query: MembersPaginationQuery,
  },
  responses: {
    200: {
      content: { "application/json": { schema: HomeMembersListResponse } },
      description: "Home members retrieved successfully",
    },
    404: { description: "Home not found" },
  },
  tags: ["Home Membership"],
});

export const addHomeMemberRoute = createRoute({
  method: "post",
  path: "/api/v1/{homeId}/members",
  summary: "Invite user to home",
  description:
    "Send invitation to a user to join the home. Only home owners and admins can invite new members. Creates invitation record and sends notification.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: AddMemberBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description: "Member invitation sent successfully",
    },
    403: { description: "Forbidden - insufficient permissions" },
    404: { description: "Home or target user not found" },
  },
  tags: ["Home Membership"],
});

export const revokeHomeMemberRoute = createRoute({
  method: "delete",
  path: "/api/v1/{homeId}/members/{userId}",
  summary: "Remove member from home",
  description:
    "Remove a member from the home or revoke their invitation. Only home owners and admins can remove members.",
  request: { params: z.object({ homeId: HomeId, userId: UserId }) },
  responses: {
    204: { description: "Member removed successfully" },
    403: { description: "Forbidden - insufficient permissions" },
    404: { description: "Home or member not found" },
  },
  tags: ["Home Membership"],
});

export const acceptHomeInviteRoute = createRoute({
  method: "post",
  path: "/api/v1/{homeId}/members/accept",
  summary: "Accept home invitation",
  description:
    "Accept an invitation to join a home. Changes membership status from INVITED to ACTIVE and grants access to home resources.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description: "Home invitation accepted successfully",
    },
    404: { description: "Invitation not found or already processed" },
  },
  tags: ["Home Membership"],
});

export const getMyHomeMemberRoute = createRoute({
  method: "get",
  path: "/api/v1/{homeId}/members/me",
  summary: "Get my membership status",
  description:
    "Retrieve the current user's membership information for a specific home including role, status, and permissions.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description: "Membership status retrieved successfully",
    },
    404: { description: "Membership not found" },
  },
  tags: ["Home Membership"],
});

export const declineHomeInviteRoute = createRoute({
  method: "post",
  path: "/api/v1/{homeId}/members/decline",
  summary: "Decline home invitation",
  description:
    "Decline an invitation to join a home. Changes membership status from INVITED to REVOKED and notifies the home owner.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    204: { description: "Home invitation declined successfully" },
    404: { description: "Invitation not found or already processed" },
  },
  tags: ["Home Membership"],
});

export const updateHomeMemberRoleRoute = createRoute({
  method: "patch",
  path: "/api/v1/{homeId}/members/{userId}",
  summary: "Update member role",
  description:
    "Change a member's role within the home (e.g., MEMBER to ADMIN). Only home owners can update member roles.",
  request: {
    params: z.object({ homeId: HomeId, userId: UserId }),
    body: { content: { "application/json": { schema: UpdateMemberRoleBody } } },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: HomeMemberDTO }) },
      },
      description: "Member role updated successfully",
    },
    403: { description: "Forbidden - insufficient permissions" },
    404: { description: "Home or member not found" },
    409: { description: "Invalid role change - cannot demote owner" },
  },
  tags: ["Home Membership"],
});

export const resendHomeInviteRoute = createRoute({
  method: "post",
  path: "/api/v1/{homeId}/members/{userId}/resend-invite",
  summary: "Resend home invitation",
  description:
    "Resend invitation email to a user who hasn't accepted their home invitation yet. Only available for INVITED status members.",
  request: { params: z.object({ homeId: HomeId, userId: UserId }) },
  responses: {
    204: { description: "Invitation email resent successfully" },
    403: { description: "Forbidden - insufficient permissions" },
    404: { description: "Invitation not found or already processed" },
  },
  tags: ["Home Membership"],
});

export type ResendHomeInviteRoute = typeof resendHomeInviteRoute;
export type UpdateHomeMemberRoleRoute = typeof updateHomeMemberRoleRoute;
export type DeclineHomeInviteRoute = typeof declineHomeInviteRoute;
export type GetMyHomeMemberRoute = typeof getMyHomeMemberRoute;
export type AcceptHomeInviteRoute = typeof acceptHomeInviteRoute;
export type ListHomeMembersRoute = typeof listHomeMembersRoute;
export type AddHomeMemberRoute = typeof addHomeMemberRoute;
export type RevokeHomeMemberRoute = typeof revokeHomeMemberRoute;
