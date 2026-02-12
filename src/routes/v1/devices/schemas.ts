import { z } from "@hono/zod-openapi";
import { DeviceId, HomeId, UserId } from "../common/ids";

export const DeviceTypeEnum = z.enum([
  "LIGHT",
  "FAN",
  "BELL",
  "DOOR",
  "SENSOR_NODE",
  "POWER_METER",
  "OTHER",
]);

export const DeviceCreateBody = z
  .object({
    deviceName: z.string().min(1).openapi({ example: "ESP32-LivingRoom" }),
    roomId: z.number().int().positive().optional().nullable(),
    mqttClientId: z.string().min(1).optional(),
    deviceKey: z.string().min(1).optional().nullable(),
    deviceType: DeviceTypeEnum.optional().default("OTHER"),
    capabilities: z.any().optional().nullable(), // Json
  })
  .openapi("DeviceCreateBody");

export const DeviceUpdateBody = z
  .object({
    deviceName: z.string().min(1).optional(),
    roomId: z.number().int().positive().optional().nullable(),
    status: z.boolean().optional(),
    lastSeenAt: z.iso.datetime().optional().nullable(),
    mqttClientId: z.string().min(1).optional().nullable(),
    deviceKey: z.string().min(1).optional().nullable(),
    deviceType: DeviceTypeEnum.optional(),
    capabilities: z.any().optional().nullable(),
  })
  .openapi("DeviceUpdateBody");

export const DeviceDTO = z
  .object({
    id: DeviceId,
    deviceName: z.string(),
    roomId: z.number().int().nullable(),
    status: z.boolean(),
    updatedAt: z.string(),
    lastSeenAt: z.string().nullable(),
    mqttClientId: z.string().nullable(),
    deviceKey: z.string().nullable(),
    deviceType: DeviceTypeEnum,
    capabilities: z.any().nullable(),
    pairedByUserId: UserId,
    homeId: HomeId,
  })
  .openapi("DeviceDTO");

export const DeviceListQuery = z.object({
  homeId: HomeId.optional(),
  status: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
