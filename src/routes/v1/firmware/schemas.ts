import { z } from "@hono/zod-openapi";

export const FirmwareReleaseId = z.coerce.number().int().positive().openapi({
  example: 12,
});

export const FirmwarePlatform = z.string().min(1).openapi({
  example: "esp32",
});

export const FirmwareVersion = z.string().min(1).openapi({
  example: "1.0.3",
});

export const FirmwareReleaseDTO = z
  .object({
    id: z.number().int().positive(),
    platform: z.string(),
    version: z.string(),
    sha256: z.string(),
    sizeBytes: z.number().int(),
    filePath: z.string(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("FirmwareReleaseDTO");

export const FirmwareReleaseListResponse = z
  .object({
    data: z.array(FirmwareReleaseDTO),
  })
  .openapi("FirmwareReleaseListResponse");

export const FirmwareReleaseResponse = z
  .object({
    data: z.object({
      id: z.number().int().positive(),
      platform: z.string(),
      version: z.string(),
      sha256: z.string(),
      sizeBytes: z.number().int(),
      downloadUrl: z.string(),
      createdAt: z.string().datetime(),
    }),
  })
  .openapi("FirmwareReleaseResponse");

// multipart/form-data upload
export const FirmwareReleaseUploadBody = z
  .object({
    platform: FirmwarePlatform,
    version: FirmwareVersion,
    notes: z.string().optional(),
    file: z.any().openapi({ type: "string", format: "binary" }),
  })
  .openapi("FirmwareReleaseUploadBody");
