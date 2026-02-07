import { z } from "@hono/zod-openapi";
import { DeviceId, SensorId } from "../common/ids";

export const SensorDataIngestBody = z
  .object({
    current: z.number().openapi({ example: 0.72 }),
    gasPpm: z.number().openapi({ example: 650 }),
    flame: z.boolean().openapi({ example: false }),
    binLevel: z.number().openapi({ example: 35.5 }),
    timestamp: z.iso
      .datetime()
      .optional()
      .openapi({ example: "2026-02-06T12:00:00.000Z" }),
  })
  .openapi("SensorDataIngestBody");

export const SensorDataDTO = z
  .object({
    id: SensorId,
    deviceId: DeviceId,
    current: z.number(),
    gasPpm: z.number(),
    flame: z.boolean(),
    binLevel: z.number(),
    timestamp: z.string(),
  })
  .openapi("SensorDataDTO");

export const TelemetryQuery = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(500),
});
