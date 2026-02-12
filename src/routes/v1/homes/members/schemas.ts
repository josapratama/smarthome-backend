import { z } from "@hono/zod-openapi";
import { UserId } from "../../common/ids";

export const HomeMemberId = z.coerce
  .number()
  .int()
  .positive()
  .openapi("HomeMemberId");

export const HomeMemberRole = z
  .enum(["OWNER", "MEMBER", "GUEST"])
  .openapi("HomeMemberRole");
export const HomeMemberStatus = z
  .enum(["INVITED", "ACTIVE", "REVOKED"])
  .openapi("HomeMemberStatus");

export const HomeMemberDTO = z
  .object({
    homeId: z.coerce.number().int().positive(),
    userId: UserId,
    roleInHome: HomeMemberRole,
    status: HomeMemberStatus,
    invitedAt: z.string(),
    joinedAt: z.string().nullable(),
  })
  .openapi("HomeMemberDTO");

export const AddMemberBody = z
  .object({
    userId: UserId,
    roleInHome: HomeMemberRole.optional().openapi({ example: "MEMBER" }),
  })
  .openapi("AddMemberBody");

export const MembersPaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().openapi({
    example: 20,
    description: "Items per page (1-100). Default 20.",
  }),
  cursor: z.coerce.number().int().positive().optional().openapi({
    example: 999,
    description:
      "Cursor = last seen homeMember id from previous page (nextCursor).",
  }),
});

export const HomeMembersListResponse = z
  .object({
    data: z.array(HomeMemberDTO),
    nextCursor: HomeMemberId.nullable(),
  })
  .openapi("HomeMembersListResponse");

export const UpdateMemberRoleBody = z
  .object({
    roleInHome: HomeMemberRole,
  })
  .openapi("UpdateMemberRoleBody");
