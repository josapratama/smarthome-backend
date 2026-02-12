import { z } from "@hono/zod-openapi";
import { DeviceId, HomeId } from "../common/ids";

export const AlarmId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 101 });

export const AlarmSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const AlarmSourceEnum = z.enum(["DEVICE", "BACKEND", "AI", "USER"]);
export const AlarmStatusEnum = z.enum(["OPEN", "ACKED", "RESOLVED"]);

export const AlarmCreateBody = z
  .object({
    deviceId: DeviceId,
    // schema baru: pilih salah satu
    sensorDataId: z.coerce.number().int().positive().optional(),
    sensorReadingId: z.coerce.number().int().positive().optional(),

    type: z.string().min(1).openapi({ example: "gas_leak" }),
    message: z
      .string()
      .min(1)
      .openapi({ example: "Gas melebihi ambang batas" }),
    severity: AlarmSeverityEnum,
    source: AlarmSourceEnum.default("BACKEND"),
    triggeredAt: z.iso.datetime().optional(),
  })
  .openapi("AlarmCreateBody");

export const AlarmDTO = z
  .object({
    id: AlarmId,
    sensorDataId: z.number().int().positive().nullable(),
    sensorReadingId: z.number().int().positive().nullable(),

    deviceId: DeviceId,
    homeId: HomeId,

    type: z.string(),
    message: z.string(),
    severity: AlarmSeverityEnum,
    source: AlarmSourceEnum,

    status: AlarmStatusEnum,
    acknowledgedAt: z.string().nullable(),
    acknowledgedBy: z.number().int().positive().nullable(),
    resolvedAt: z.string().nullable(),
    resolvedBy: z.number().int().positive().nullable(),

    triggeredAt: z.string(),
  })
  .openapi("AlarmDTO");

export const AlarmsQuery = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  status: AlarmStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(200),
});
