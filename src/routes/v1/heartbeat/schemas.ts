import { z } from "@hono/zod-openapi";

/**
 * Header schema untuk OpenAPI doc (validasi auth tetap dilakukan oleh middleware requireDeviceKey).
 * Kalau kamu juga ingin zod-openapi mem-validasi header, ini bisa dipakai di request.headers.
 */
export const DeviceKeyHeaderSchema = z.object({
  "x-device-key": z.string().min(1).openapi({
    example: "devkey_123",
    description: "Device key untuk otentikasi device",
  }),
});

export const HeartbeatParamsSchema = z.object({
  deviceId: z.string().openapi({
    param: {
      name: "deviceId",
      in: "path",
      required: true,
    },
    example: "1",
    description: "Device ID (path param)",
  }),
});

export const HeartbeatBodySchema = z
  .object({
    mqttClientId: z.string().min(1).optional().openapi({
      example: "mqtt-client-001",
      description:
        "Optional MQTT client id (akan disimpan ke device.mqttClientId)",
    }),
  })
  .openapi("HeartbeatBody");

export const DeviceDTOSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    status: z.boolean().openapi({ example: true }),
    lastSeenAt: z.iso.datetime().nullable().openapi({
      example: "2026-02-07T10:11:12.000Z",
    }),
    mqttClientId: z.string().nullable().openapi({ example: "mqtt-client-001" }),
  })
  .openapi("DeviceDTO");

export const HeartbeatResponseSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
    serverTime: z.iso.datetime().openapi({
      example: "2026-02-07T10:11:12.000Z",
    }),
    device: DeviceDTOSchema,
  })
  .openapi("HeartbeatResponse");

export const ErrorResponseSchema = z
  .object({
    error: z
      .enum(["DEVICE_KEY_REQUIRED", "INVALID_DEVICE_KEY", "DEVICE_NOT_FOUND"])
      .openapi({ example: "INVALID_DEVICE_KEY" }),
  })
  .openapi("DeviceAuthError");
