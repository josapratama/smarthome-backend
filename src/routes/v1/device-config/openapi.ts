import { createRoute, z } from "@hono/zod-openapi";
import { DeviceId } from "../common/ids";
import { DeviceConfigDTO, UpsertDeviceConfigBody } from "./schemas";

export const getDeviceConfigRoute = createRoute({
  method: "get",
  path: "/devices/{deviceId}/config",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceConfigDTO }) },
      },
      description: "Get device config (or empty/default if not set).",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Device not found" },
  },
});
export type GetDeviceConfigRoute = typeof getDeviceConfigRoute;

export const upsertDeviceConfigRoute = createRoute({
  method: "put",
  path: "/devices/{deviceId}/config",
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
      description: "Create/update device config.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Device not found" },
  },
});
export type UpsertDeviceConfigRoute = typeof upsertDeviceConfigRoute;
