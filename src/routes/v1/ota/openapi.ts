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
  summary: "Trigger OTA update",
  description:
    "Initiate an Over-The-Air firmware update for a specific device. The device will be notified via MQTT to download and install the specified firmware version.",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: TriggerOtaBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: TriggerOtaResponse } },
      description: "OTA update triggered successfully",
    },
    404: { description: "Device or firmware release not found" },
    400: {
      description: "Bad request - invalid firmware version or device offline",
    },
  },
  tags: ["OTA Management"],
});

// GET /api/v1/ota/devices/{deviceId}/jobs
export const listDeviceOtaJobsRoute = createRoute({
  method: "get",
  path: "/api/v1/ota/devices/{deviceId}/jobs",
  summary: "List device OTA jobs",
  description:
    "Retrieve the history of OTA update jobs for a specific device including status, progress, and error information.",
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtaJobListResponse } },
      description: "OTA jobs retrieved successfully",
    },
  },
  tags: ["OTA Management"],
});

// GET /api/v1/ota/jobs/{otaJobId}
export const getOtaJobRoute = createRoute({
  method: "get",
  path: "/api/v1/ota/jobs/{otaJobId}",
  summary: "Get OTA job details",
  description:
    "Retrieve detailed information about a specific OTA update job including current status, progress percentage, error messages, and timing information.",
  request: {
    params: z.object({ otaJobId: OtaJobId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtaJobResponse } },
      description: "OTA job details retrieved successfully",
    },
    404: { description: "OTA job not found" },
  },
  tags: ["OTA Management"],
});
