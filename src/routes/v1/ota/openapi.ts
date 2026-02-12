import { createRoute, z } from "@hono/zod-openapi";
import {
  DeviceId,
  OtaJobId,
  TriggerOtaBody,
  TriggerOtaResponse,
  OtaJobResponse,
  OtaJobListResponse,
} from "./schemas";

// POST /api/v1/ota/devices/{deviceId}
export const triggerOtaRoute = createRoute({
  method: "post",
  path: "/api/v1/ota/devices/{deviceId}",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: TriggerOtaBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: TriggerOtaResponse } },
      description: "Trigger OTA to a device.",
    },
    404: { description: "Device or firmware release not found" },
    400: { description: "Bad request" },
  },
  tags: ["Ota"],
});
export type TriggerOtaRoute = typeof triggerOtaRoute;

// GET /api/v1/ota/devices/{deviceId}/jobs
export const listDeviceOtaJobsRoute = createRoute({
  method: "get",
  path: "/api/v1/ota/devices/{deviceId}/jobs",
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtaJobListResponse } },
      description: "List OTA jobs for a device.",
    },
  },
  tags: ["Ota"],
});
export type ListDeviceOtaJobsRoute = typeof listDeviceOtaJobsRoute;

// GET /api/v1/ota/jobs/{otaJobId}
export const getOtaJobRoute = createRoute({
  method: "get",
  path: "/api/v1/ota/jobs/{otaJobId}",
  request: {
    params: z.object({ otaJobId: OtaJobId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtaJobResponse } },
      description: "Get OTA job detail.",
    },
    404: { description: "OTA job not found" },
  },
  tags: ["Ota"],
});
export type GetOtaJobRoute = typeof getOtaJobRoute;
