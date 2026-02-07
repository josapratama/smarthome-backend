import { z } from "@hono/zod-openapi";
import { DeviceId, HomeId, SensorId } from "../common/ids";

export const AlarmCreateBody = z
  .object({
    deviceId: DeviceId,
    sensorId: SensorId.optional(),
    type: z.string().min(1).openapi({ example: "gas_leak" }),
    message: z
      .string()
      .min(1)
      .openapi({ example: "Gas melebihi ambang batas" }),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.enum(["DEVICE", "BACKEND", "AI", "USER"]).default("BACKEND"),
    triggeredAt: z.iso
      .datetime()
      .optional()
      .openapi({ example: "2026-02-06T12:00:05.000Z" }),
  })
  .openapi("AlarmCreateBody");

export const AlarmDTO = z
  .object({
    id: z.coerce.number().int(),
    sensorId: SensorId,
    deviceId: DeviceId,
    homeId: HomeId.nullable(),
    type: z.string(),
    message: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.enum(["DEVICE", "BACKEND", "AI", "USER"]),
    triggeredAt: z.string(),
  })
  .openapi("AlarmDTO");

export const EventsQuery = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(200),
});
