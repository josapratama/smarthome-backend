import { prisma } from "../../lib/prisma";
import { processAlarmsFromTelemetry } from "../alarms/alarms.service";
import { AIOrchestrationService } from "../ai/ai.service";

type TelemetryInput = {
  current?: number;
  gasPpm?: number;
  flame?: boolean;
  binLevel?: number;
  powerW?: number;
  energyKwh?: number;

  // PZEM004 v3 additional fields
  voltageV?: number;
  currentA?: number;
  frequencyHz?: number;
  powerFactor?: number;

  // Ultrasonic raw distance
  distanceCm?: number;

  timestamp?: string | Date;
};

export async function ingestTelemetry(params: {
  deviceId: number;
  telemetry: TelemetryInput;
  source?: "DEVICE" | "BACKEND" | "AI" | "USER";
  enableAI?: boolean;
}) {
  const { deviceId, telemetry, enableAI = true } = params;

  const device = await prisma.device.findFirst({
    where: { id: deviceId, deletedAt: null },
    select: { id: true, homeId: true },
  });
  if (!device) return { error: "DEVICE_NOT_FOUND" as const };

  const ts =
    telemetry.timestamp instanceof Date
      ? telemetry.timestamp
      : telemetry.timestamp
        ? new Date(telemetry.timestamp)
        : new Date();

  const current = telemetry.current ?? 0;
  const gasPpm = telemetry.gasPpm ?? 0;
  const flame = telemetry.flame ?? false;
  const binLevel = telemetry.binLevel ?? 0;

  const sensor = await prisma.sensorData.create({
    data: {
      deviceId,
      current,
      gasPpm,
      flame,
      binLevel,
      powerW: telemetry.powerW ?? null,
      energyKwh: telemetry.energyKwh ?? null,

      // PZEM004 v3 fields
      voltageV: telemetry.voltageV ?? null,
      currentA: telemetry.currentA ?? null,
      frequencyHz: telemetry.frequencyHz ?? null,
      powerFactor: telemetry.powerFactor ?? null,

      // Ultrasonic distance
      distanceCm: telemetry.distanceCm ?? null,

      timestamp: ts,
    },
  });

  await prisma.device.update({
    where: { id: deviceId },
    data: { status: true, lastSeenAt: new Date() },
  });

  // Alarm engine (optional)
  await processAlarmsFromTelemetry({
    sensorDataId: sensor.id, // ✅ schema baru
    deviceId,
    homeId: device.homeId,
    source: params.source ?? "DEVICE",
    telemetry: {
      current,
      gasPpm,
      flame,
      binLevel,
      powerW: telemetry.powerW,
      energyKwh: telemetry.energyKwh,
      voltageV: telemetry.voltageV,
      currentA: telemetry.currentA,
      frequencyHz: telemetry.frequencyHz,
      powerFactor: telemetry.powerFactor,
      distanceCm: telemetry.distanceCm,
    },
  });

  // AI Processing (optional, async)
  let aiResult = null;
  if (enableAI && telemetry.powerW !== undefined) {
    try {
      aiResult = await AIOrchestrationService.processTelemetryAI({
        deviceId,
        sensorData: {
          current,
          gasPpm,
          flame,
          binLevel,
          powerW: telemetry.powerW,
          energyKwh: telemetry.energyKwh,
          voltageV: telemetry.voltageV,
          currentA: telemetry.currentA,
          frequencyHz: telemetry.frequencyHz,
          powerFactor: telemetry.powerFactor,
          distanceCm: telemetry.distanceCm,
        },
        timestamp: ts,
      });
    } catch (error) {
      console.warn("[AI] Processing failed for device", deviceId, error);
    }
  }

  return { sensor, aiResult };
}

export async function getLatestTelemetry(deviceId: number) {
  return prisma.sensorData.findFirst({
    where: { deviceId },
    orderBy: { timestamp: "desc" },
  });
}

export async function queryTelemetry(params: {
  deviceId: number;
  from?: string;
  to?: string;
  limit: number;
}) {
  return prisma.sensorData.findMany({
    where: {
      deviceId: params.deviceId,
      timestamp: {
        gte: params.from ? new Date(params.from) : undefined,
        lte: params.to ? new Date(params.to) : undefined,
      },
    },
    orderBy: { timestamp: "desc" },
    take: Math.min(Math.max(params.limit, 1), 5000),
  });
}
