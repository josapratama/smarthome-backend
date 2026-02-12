import { z } from "@hono/zod-openapi";
import { CommandId, DeviceId } from "../common/ids";

export const CommandCreateBody = z
  .object({
    type: z.string().min(1).openapi({ example: "relay_set" }),
    payload: z.any().openapi({ example: { relay: 1, state: "ON" } }),
    // optional override source (biasanya USER)
    source: z.enum(["USER", "BACKEND", "AI", "ADMIN"]).optional(),
  })
  .openapi("CommandCreateBody");

export const CommandDTO = z
  .object({
    id: CommandId,
    deviceId: DeviceId,
    type: z.string(),
    payload: z.any(),
    status: z.enum(["PENDING", "SENT", "ACKED", "FAILED", "TIMEOUT"]),
    ackedAt: z.string().nullable(),
    lastError: z.string().nullable(),
    requestedBy: z.number().int().positive().nullable(),
    source: z.enum(["USER", "BACKEND", "AI", "ADMIN"]),
    correlationId: z.string(), // uuid string
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CommandDTO");
