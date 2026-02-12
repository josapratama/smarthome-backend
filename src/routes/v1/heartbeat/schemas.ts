import { z } from "@hono/zod-openapi";

export const DeviceKeyHeaderSchema = z.object({
  "x-device-key": z.string().min(1).openapi({
    example: "devkey_123",
    description: "Device key untuk otentikasi device",
  }),
});

export const HeartbeatParamsSchema = z.object({
  deviceId: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: { name: "deviceId", in: "path", required: true },
      example: 1,
      description: "Device ID (path param)",
    }),
});

export const HeartbeatBodySchema = z
  .object({
    mqttClientId: z.string().min(1).optional().openapi({
      example: "mqtt-client-001",
      description: "Optional MQTT client id (disimpan ke device.mqttClientId)",
    }),
  })
  .openapi("HeartbeatBody");

export const HeartbeatDeviceDTOSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    status: z.boolean().openapi({ example: true }),
    lastSeenAt: z
      .string()
      .nullable()
      .openapi({ example: "2026-02-07T10:11:12.000Z" }),
    mqttClientId: z.string().nullable().openapi({ example: "mqtt-client-001" }),
    updatedAt: z.string().openapi({ example: "2026-02-07T10:11:12.000Z" }),
  })
  .openapi("HeartbeatDeviceDTO");

export const HeartbeatResponseSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
    serverTime: z.string().openapi({ example: "2026-02-07T10:11:12.000Z" }),
    device: HeartbeatDeviceDTOSchema,
  })
  .openapi("HeartbeatResponse");

export const DeviceAuthErrorSchema = z
  .object({
    error: z
      .enum([
        "DEVICE_KEY_REQUIRED",
        "DEVICE_KEY_NOT_SET",
        "INVALID_DEVICE_KEY",
        "DEVICE_NOT_FOUND",
      ])
      .openapi({ example: "INVALID_DEVICE_KEY" }),
  })
  .openapi("DeviceAuthError");
