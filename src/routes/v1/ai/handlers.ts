import { prisma } from "../../../lib/prisma";
import { toISO } from "../common/helpers";

export function mapPredictionDTO(p: any) {
  return {
    id: p.id,
    deviceId: p.deviceId,
    predictedEnergy: p.predictedEnergy,
    actualEnergy: p.actualEnergy ?? null,
    windowStart: toISO(p.windowStart),
    windowEnd: toISO(p.windowEnd),
    modelVersion: p.modelVersion ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export function mapAnomalyDTO(r: any) {
  return {
    id: r.id,
    predictionId: r.predictionId,
    isAnomaly: r.isAnomaly,
    score: r.score,
    metric: (r.metric as any) ?? null,
    details: (r.details as any) ?? null,
    detectedAt: r.detectedAt.toISOString(),
  };
}

export async function createPrediction(deviceId: number, body: any) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return { error: "DEVICE_NOT_FOUND" as const };

  const p = await prisma.energyPrediction.create({
    data: {
      deviceId,
      predictedEnergy: body.predictedEnergy,
      actualEnergy: body.actualEnergy,
      windowStart: body.windowStart ? new Date(body.windowStart) : undefined,
      windowEnd: body.windowEnd ? new Date(body.windowEnd) : undefined,
      modelVersion: body.modelVersion,
    },
  });

  return { p };
}

export async function listPredictions(deviceId: number, limit: number) {
  const rows = await prisma.energyPrediction.findMany({
    where: { deviceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows;
}

export async function createAnomaly(predictionId: number, body: any) {
  const pred = await prisma.energyPrediction.findUnique({
    where: { id: predictionId },
  });
  if (!pred) return { error: "PREDICTION_NOT_FOUND" as const };

  const row = await prisma.anomalyResult.create({
    data: {
      predictionId,
      isAnomaly: body.isAnomaly,
      score: body.score,
      metric: body.metric,
      details: body.details,
      detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
    },
  });

  return { row };
}

export async function listAnomalies(predictionId: number, limit: number) {
  const rows = await prisma.anomalyResult.findMany({
    where: { predictionId },
    orderBy: { detectedAt: "desc" },
    take: limit,
  });
  return rows;
}
