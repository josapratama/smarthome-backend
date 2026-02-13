import { z } from "@hono/zod-openapi";
import { DeviceId, SensorId } from "../common/ids";

export const SensorDataIngestBody = z
  .object({
    current: z.number().optional().openapi({ example: 0.72 }),
    gasPpm: z.number().optional().openapi({ example: 650 }),
    flame: z.boolean().optional().openapi({ example: false }),
    binLevel: z.number().optional().openapi({ example: 35.5 }),

    // Power meter fields
    powerW: z.number().optional().openapi({ example: 120.5 }),
    energyKwh: z.number().optional().openapi({ example: 3.14 }),

    // PZEM004 v3 additional fields
    voltageV: z.number().optional().openapi({ example: 220.5 }),
    currentA: z.number().optional().openapi({ example: 0.55 }),
    frequencyHz: z.number().optional().openapi({ example: 50.0 }),
    powerFactor: z.number().optional().openapi({ example: 0.95 }),

    // Ultrasonic sensor raw distance
    distanceCm: z.number().optional().openapi({ example: 25.3 }),

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

    powerW: z.number().nullable(),
    energyKwh: z.number().nullable(),

    // PZEM004 v3 additional fields
    voltageV: z.number().nullable(),
    currentA: z.number().nullable(),
    frequencyHz: z.number().nullable(),
    powerFactor: z.number().nullable(),

    // Ultrasonic raw distance
    distanceCm: z.number().nullable(),

    timestamp: z.string(),
  })
  .openapi("SensorDataDTO");

export const TelemetryQuery = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(500),
});

export const DeviceKeyHeaderOptionalSchema = z.object({
  "x-device-key": z.string().optional(),
});
