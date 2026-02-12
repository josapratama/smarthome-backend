import { z } from "@hono/zod-openapi";

export const InviteToken = z.string().uuid().openapi("InviteToken");

export const InviteAcceptResponse = z
  .object({
    data: z.object({
      homeId: z.number().int().positive(),
      userId: z.number().int().positive(),
      status: z.literal("ACTIVE"),
      joinedAt: z.string(),
    }),
  })
  .openapi("InviteAcceptResponse");
