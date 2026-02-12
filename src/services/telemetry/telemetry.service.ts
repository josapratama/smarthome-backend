import { prisma } from "../../lib/prisma";
import { processAlarmsFromTelemetry } from "../alarms/alarms.service";

type TelemetryInput = {
  current?: number;
  gasPpm?: number;
  flame?: boolean;
  binLevel?: number;
  powerW?: number;
  energyKwh?: number;
  timestamp?: string | Date;
};

export async function ingestTelemetry(params: {
  deviceId: number;
  telemetry: TelemetryInput;
  source?: "DEVICE" | "BACKEND" | "AI" | "USER";
}) {
  const { deviceId, telemetry } = params;

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
    },
  });

  return { sensor };
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
