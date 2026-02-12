import { createRoute, z } from "@hono/zod-openapi";
import { DeviceId, HomeId } from "../common/ids";
import {
  DeviceCreateBody,
  DeviceDTO,
  DeviceUpdateBody,
  DeviceListQuery,
} from "./schemas";

export const devicesListRoute = createRoute({
  method: "get",
  path: "/api/v1/devices",
  request: { query: DeviceListQuery },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(DeviceDTO) }) },
      },
      description: "List devices (optional filter by homeId/status).",
    },
    401: { description: "Unauthorized" },
  },
  tags: ["Devices"],
});
export type DevicesListRoute = typeof devicesListRoute;

export const devicesCreateUnderHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/devices",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: DeviceCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Create device under a home.",
    },
    401: { description: "Unauthorized" },
    404: { description: "Home not found" },
  },
  tags: ["Devices"],
});
export type DevicesCreateUnderHomeRoute = typeof devicesCreateUnderHomeRoute;

export const devicesGetByIdRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Get device details.",
    },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
  tags: ["Devices"],
});
export type DevicesGetByIdRoute = typeof devicesGetByIdRoute;

export const devicesPatchRoute = createRoute({
  method: "patch",
  path: "/api/v1/devices/{deviceId}",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: DeviceUpdateBody } } },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Update device.",
    },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
  tags: ["Devices"],
});
export type DevicesPatchRoute = typeof devicesPatchRoute;
