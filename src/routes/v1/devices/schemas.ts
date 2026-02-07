import { z } from "@hono/zod-openapi";
import { DeviceId, HomeId, UserId } from "../common/ids";

export const DeviceCreateBody = z
  .object({
    deviceName: z.string().min(1).openapi({ example: "ESP32-LivingRoom" }),
    room: z.string().min(1).optional().openapi({ example: "Ruang Tamu" }),
    mqttClientId: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "esp32-livingroom-001" }),
    deviceKey: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "devkey-optional" }),
  })
  .openapi("DeviceCreateBody");

export const DeviceUpdateBody = z
  .object({
    deviceName: z.string().min(1).optional(),
    room: z.string().min(1).optional(),
    status: z.boolean().optional(),
    lastSeenAt: z.iso.datetime().optional(),
    mqttClientId: z.string().min(1).optional(),
    deviceKey: z.string().min(1).optional(),
    homeId: HomeId.optional().nullable(),
  })
  .openapi("DeviceUpdateBody");

export const DeviceDTO = z
  .object({
    id: DeviceId,
    deviceName: z.string(),
    room: z.string().nullable(),
    status: z.boolean(),
    updatedAt: z.string(),
    lastSeenAt: z.string().nullable(),
    mqttClientId: z.string().nullable(),
    userId: UserId,
    homeId: HomeId.nullable(),
  })
  .openapi("DeviceDTO");
