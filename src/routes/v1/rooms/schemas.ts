import { z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";

export const RoomCreateBody = z
  .object({
    name: z.string().min(1).openapi({ example: "Ruang Tamu" }),
  })
  .openapi("RoomCreateBody");

export const RoomUpdateBody = z
  .object({
    name: z.string().min(1).optional().openapi({ example: "Kamar Utama" }),
  })
  .openapi("RoomUpdateBody");

export const RoomDTO = z
  .object({
    id: z.number().int(),
    homeId: HomeId,
    name: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullable(),
  })
  .openapi("RoomDTO");
