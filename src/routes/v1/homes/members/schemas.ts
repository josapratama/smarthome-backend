import { z } from "@hono/zod-openapi";
import { UserId } from "../../common/ids";

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
