import { z } from "@hono/zod-openapi";
import { Email } from "../common/schemas";
import { HomeId, UserId } from "../common/ids";

export const HomeUpdateBody = z
  .object({
    name: z.string().min(1).optional(),
    ownerUserId: UserId.optional(),
  })
  .refine((v) => v.name !== undefined || v.ownerUserId !== undefined, {
    message: "At least one field must be provided",
  })
  .openapi("HomeUpdateBody");

export const HomeCreateBody = z
  .object({
    name: z.string().min(1).openapi({ example: "Rumah Utama" }),
    ownerUserId: UserId,
  })
  .openapi("HomeCreateBody");

export const HomeDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    ownerUserId: UserId,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("HomeDTO");

export const HomesPaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().openapi({
    example: 20,
    description: "Items per page (1-100). Default 20.",
  }),
  cursor: z.coerce.number().int().positive().optional().openapi({
    example: 123,
    description: "Cursor = last seen home id from previous page (nextCursor).",
  }),
});

export const HomesListResponse = z
  .object({
    data: z.array(HomeDTO),
    nextCursor: HomeId.nullable(),
  })
  .openapi("HomesListResponse");

export const HomesListQuery = z
  .object({
    ownerId: UserId.optional(),
    ownerEmail: Email.optional(),
  })
  .extend(HomesPaginationQuery.shape);

export const TransferOwnershipBody = z
  .object({
    newOwnerUserId: UserId,
  })
  .openapi("TransferOwnershipBody");
