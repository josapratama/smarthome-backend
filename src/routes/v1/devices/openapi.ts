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
  summary: "List all devices",
  description:
    "Retrieve a list of all devices with optional filtering by home ID and status. Supports pagination and filtering.",
  request: { query: DeviceListQuery },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(DeviceDTO) }) },
      },
      description: "Devices retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
  },
  tags: ["Device Management"],
});
export type DevicesListRoute = typeof devicesListRoute;

export const devicesCreateUnderHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/devices",
  summary: "Create device in home",
  description:
    "Add a new device to a specific home. The device will be associated with the specified home and can be assigned to a room.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: DeviceCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Device created successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    404: { description: "Home not found" },
  },
  tags: ["Device Management"],
});
export type DevicesCreateUnderHomeRoute = typeof devicesCreateUnderHomeRoute;

export const devicesGetByIdRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}",
  summary: "Get device details",
  description:
    "Retrieve detailed information about a specific device including its configuration, status, and associated home/room.",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Device details retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    404: { description: "Device not found" },
  },
  tags: ["Device Management"],
});
export type DevicesGetByIdRoute = typeof devicesGetByIdRoute;

export const devicesPatchRoute = createRoute({
  method: "patch",
  path: "/api/v1/devices/{deviceId}",
  summary: "Update device",
  description:
    "Update device properties such as name, room assignment, status, or configuration. Supports partial updates.",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: DeviceUpdateBody } } },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: DeviceDTO }) },
      },
      description: "Device updated successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    404: { description: "Device not found" },
  },
  tags: ["Device Management"],
});
export type DevicesPatchRoute = typeof devicesPatchRoute;

export const devicesDeleteRoute = createRoute({
  method: "delete",
  path: "/api/v1/devices/{deviceId}",
  summary: "Delete device",
  description:
    "Soft delete a device. The device will be marked as deleted but can be restored later. All associated data will be preserved.",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Device deleted successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    404: { description: "Device not found" },
  },
  tags: ["Device Management"],
});
export type DevicesDeleteRoute = typeof devicesDeleteRoute;
