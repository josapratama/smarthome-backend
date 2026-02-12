import { z } from "@hono/zod-openapi";
import { Email } from "../common/schemas";
import { HomeId, UserId } from "../common/ids";

export const HomeCreateBody = z
  .object({
    name: z.string().min(1).openapi({ example: "Rumah Utama" }),
    ownerUserId: UserId,

    addressText: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
  })
  .openapi("HomeCreateBody");

export const HomeUpdateBody = z
  .object({
    name: z.string().min(1).optional(),
    ownerUserId: UserId.optional(),

    addressText: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.ownerUserId !== undefined ||
      v.addressText !== undefined ||
      v.city !== undefined ||
      v.postalCode !== undefined ||
      v.latitude !== undefined ||
      v.longitude !== undefined,
    { message: "At least one field must be provided" },
  )
  .openapi("HomeUpdateBody");

export const HomeDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    ownerUserId: UserId,

    addressText: z.string().nullable(),
    city: z.string().nullable(),
    postalCode: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),

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

    city: z.string().min(1).optional().openapi({ example: "Jakarta" }),
  })
  .extend(HomesPaginationQuery.shape);

export const TransferOwnershipBody = z
  .object({
    newOwnerUserId: UserId,
  })
  .openapi("TransferOwnershipBody");
