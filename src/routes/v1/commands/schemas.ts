import { z } from "@hono/zod-openapi";
import { CommandId, DeviceId } from "../common/ids";

export const CommandCreateBody = z
  .object({
    type: z.string().min(1).openapi({ example: "relay_set" }),
    payload: z
      .record(z.string(), z.any())
      .openapi({ example: { relay: 1, state: "ON" } }),
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
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CommandDTO");
