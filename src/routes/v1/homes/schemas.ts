import { z } from "@hono/zod-openapi";
import { Email } from "../common/schemas";
import { HomeId, UserId } from "../common/ids";

export const HomeUpdateBody = z
  .object({
    name: z.string().min(1).optional(),
    ownerId: UserId.optional(),
  })
  .refine((v) => v.name !== undefined || v.ownerId !== undefined, {
    message: "At least one field must be provided",
  })
  .openapi("HomeUpdateBody");

export const HomeCreateBody = z
  .object({
    name: z.string().min(1).openapi({ example: "Rumah Utama" }),
    ownerId: UserId,
  })
  .openapi("HomeCreateBody");

export const HomeDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    ownerId: UserId,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("HomeDTO");

export const HomesListQuery = z.object({
  ownerId: UserId.optional(),
  ownerEmail: Email.optional(),
});
