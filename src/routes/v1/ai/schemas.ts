import { z } from "@hono/zod-openapi";
import { DeviceId, PredictionId } from "../common/ids";

export const EnergyPredictionCreateBody = z
  .object({
    predictedEnergy: z.number().openapi({ example: 1.25 }),
    actualEnergy: z.number().optional().openapi({ example: 1.1 }),
    windowStart: z.iso.datetime().optional(),
    windowEnd: z.iso.datetime().optional(),
    modelVersion: z.string().min(1).optional().openapi({ example: "v1" }),
  })
  .openapi("EnergyPredictionCreateBody");

export const EnergyPredictionDTO = z
  .object({
    id: PredictionId,
    deviceId: DeviceId,
    predictedEnergy: z.number(),
    actualEnergy: z.number().nullable(),
    windowStart: z.string().nullable(),
    windowEnd: z.string().nullable(),
    modelVersion: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("EnergyPredictionDTO");

export const AnomalyCreateBody = z
  .object({
    isAnomaly: z.boolean(),
    score: z.number().openapi({ example: 0.87 }),
    metric: z.enum(["POWER", "GAS", "FLAME", "TRASH"]).optional(),
    details: z.record(z.string(), z.any()).optional(),
    detectedAt: z.iso.datetime().optional(),
  })
  .openapi("AnomalyCreateBody");

export const AnomalyDTO = z
  .object({
    id: z.coerce.number().int(),
    predictionId: PredictionId,
    isAnomaly: z.boolean(),
    score: z.number(),
    metric: z.enum(["POWER", "GAS", "FLAME", "TRASH"]).nullable(),
    details: z.any().nullable(),
    detectedAt: z.string(),
  })
  .openapi("AnomalyDTO");

export const LimitQuery200 = z.object({
  limit: z.coerce.number().int().min(1).max(5000).default(200),
});
