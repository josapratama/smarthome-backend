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
  request: {
    query: z.object({
      platform: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: FirmwareReleaseListResponse } },
      description: "List firmware releases.",
    },
  },
  tags: ["Firmware"],
});
export type FirmwareListReleasesRoute = typeof firmwareListReleasesRoute;

// POST /api/v1/firmware/releases
export const firmwareUploadReleaseRoute = createRoute({
  method: "post",
  path: "/api/v1/firmware/releases",
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
      description: "Upload a firmware release.",
    },
    400: { description: "Bad request" },
    409: { description: "Duplicate firmware (sha256 unique)" },
  },
  tags: ["Firmware"],
});
export type FirmwareUploadReleaseRoute = typeof firmwareUploadReleaseRoute;

// GET /api/v1/firmware/releases/{id}/download
export const firmwareDownloadReleaseRoute = createRoute({
  method: "get",
  path: "/api/v1/firmware/releases/{id}/download",
  request: {
    params: z.object({ id: FirmwareReleaseId }),
  },
  responses: {
    200: {
      content: { "application/octet-stream": { schema: z.any() } },
      description: "Download firmware binary.",
    },
    404: { description: "Not found" },
  },
  tags: ["Firmware"],
});
export type FirmwareDownloadReleaseRoute = typeof firmwareDownloadReleaseRoute;
