import { createRoute, z } from "@hono/zod-openapi";
import {
  FirmwareReleaseId,
  FirmwareReleaseUploadBody,
  FirmwareReleaseResponse,
  FirmwareReleaseListResponse,
} from "./schemas";

// GET /api/v1/firmware/releases
export const firmwareListReleasesRoute = createRoute({
  method: "get",
  path: "/api/v1/firmware/releases",
  summary: "List firmware releases",
  description:
    "Retrieve available firmware releases for devices with optional filtering by platform. Includes version information, release notes, and download links.",
  request: {
    query: z.object({
      platform: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: FirmwareReleaseListResponse } },
      description: "Firmware releases retrieved successfully",
    },
  },
  tags: ["Firmware Management"],
});

// POST /api/v1/firmware/releases
export const firmwareUploadReleaseRoute = createRoute({
  method: "post",
  path: "/api/v1/firmware/releases",
  summary: "Upload firmware release",
  description:
    "Upload a new firmware release binary file with version information and release notes. The firmware will be validated and made available for OTA updates.",
  request: {
    body: {
      content: {
        "multipart/form-data": { schema: FirmwareReleaseUploadBody },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: FirmwareReleaseResponse } },
      description: "Firmware release uploaded successfully",
    },
    400: { description: "Bad request - invalid firmware file or metadata" },
    409: { description: "Duplicate firmware - SHA256 hash already exists" },
  },
  tags: ["Firmware Management"],
});

// GET /api/v1/firmware/releases/{id}/download
export const firmwareDownloadReleaseRoute = createRoute({
  method: "get",
  path: "/api/v1/firmware/releases/{id}/download",
  summary: "Download firmware binary",
  description:
    "Download the firmware binary file for a specific release. This endpoint is used by devices during OTA updates and by administrators for manual deployment.",
  request: {
    params: z.object({ id: FirmwareReleaseId }),
  },
  responses: {
    200: {
      content: { "application/octet-stream": { schema: z.any() } },
      description: "Firmware binary downloaded successfully",
    },
    404: { description: "Firmware release not found" },
  },
  tags: ["Firmware Management"],
});
