import { z } from "@hono/zod-openapi";

export const DeviceId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const OtaJobId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 77 });
export const FirmwareReleaseId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 12 });

export const TriggerOtaBody = z
  .object({
    releaseId: FirmwareReleaseId,
  })
  .openapi("TriggerOtaBody");

export const TriggerOtaResponse = z
  .object({
    data: z.object({
      otaJobId: z.number().int().positive(),
      commandId: z.number().int().positive(),
      status: z.enum(["SENT", "FAILED", "PENDING"]),
    }),
  })
  .openapi("TriggerOtaResponse");

export const OtaJobDTO = z
  .object({
    id: z.number().int().positive(),
    deviceId: z.number().int().positive(),
    releaseId: z.number().int().positive(),
    status: z.string(),
    progress: z.number().nullable(),
    lastError: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("OtaJobDTO");

export const OtaJobResponse = z
  .object({
    data: OtaJobDTO,
  })
  .openapi("OtaJobResponse");

export const OtaJobListResponse = z
  .object({
    data: z.array(OtaJobDTO),
  })
  .openapi("OtaJobListResponse");
