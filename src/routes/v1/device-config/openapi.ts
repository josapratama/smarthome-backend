import { createRoute, z } from "@hono/zod-openapi";
import { DeviceId } from "../common/ids";
import { DeviceConfigDTO, UpsertDeviceConfigBody } from "./schemas";

export const getDeviceConfigRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}/config",
  summary: "Get device configuration",
  description:
    "Retrieve the current configuration settings for a specific device including sensor thresholds, update intervals, and operational parameters.",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceConfigDTO }) },
      },
      description: "Device configuration retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: {
      description: "Forbidden - insufficient permissions for this device",
    },
    404: { description: "Device not found" },
  },
  tags: ["Device Configuration"],
});

export const upsertDeviceConfigRoute = createRoute({
  method: "put",
  path: "/api/v1/devices/{deviceId}/config",
  summary: "Update device configuration",
  description:
    "Create or update configuration settings for a device. This will replace the entire configuration object and notify the device of changes via MQTT.",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: {
      content: { "application/json": { schema: UpsertDeviceConfigBody } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceConfigDTO }) },
      },
      description: "Device configuration updated successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: {
      description: "Forbidden - insufficient permissions for this device",
    },
    404: { description: "Device not found" },
  },
  tags: ["Device Configuration"],
});
