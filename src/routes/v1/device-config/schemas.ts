import { z } from "@hono/zod-openapi";

export const DeviceConfigDTO = z
  .object({
    deviceId: z.number().int().positive(),
    config: z.any(), // Json
    updatedBy: z.number().int().nullable(),
    updatedAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("DeviceConfigDTO");

export const UpsertDeviceConfigBody = z
  .object({
    config: z.any(),
  })
  .openapi("UpsertDeviceConfigBody");
