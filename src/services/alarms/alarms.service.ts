import { prisma } from "../../lib/prisma";

export async function processAlarmsFromTelemetry(input: {
  sensorDataId: number;
  deviceId: number;
  homeId: number;
  source?: "DEVICE" | "BACKEND" | "AI" | "USER";
  telemetry: {
    current: number;
    gasPpm: number;
    flame: boolean;
    binLevel: number;
    powerW?: number;
    energyKwh?: number;
  };
}) {
  const { sensorDataId, deviceId, homeId, source, telemetry } = input;

  // contoh rules sederhana (ubah sesuai kebutuhan)
  const alarms: Array<{
    type: string;
    message: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }> = [];

  // Gas leak rule (contoh)
  if (telemetry.gasPpm >= 800) {
    alarms.push({
      type: "gas_leak",
      message: `Gas ppm tinggi: ${telemetry.gasPpm}`,
      severity: telemetry.gasPpm >= 1200 ? "CRITICAL" : "HIGH",
    });
  }

  // Flame detected rule (contoh)
  if (telemetry.flame) {
    alarms.push({
      type: "flame_detected",
      message: "Flame detected",
      severity: "CRITICAL",
    });
  }

  // Bin full rule (contoh)
  if (telemetry.binLevel >= 85) {
    alarms.push({
      type: "bin_full",
      message: `Bin level tinggi: ${telemetry.binLevel}%`,
      severity: telemetry.binLevel >= 95 ? "HIGH" : "MEDIUM",
    });
  }

  if (alarms.length === 0) return { created: 0 };

  // Insert alarms (no dedup for now; bisa ditambah rule dedup by time window)
  await prisma.alarmEvent.createMany({
    data: alarms.map((a) => ({
      sensorDataId,
      sensorReadingId: null,
      deviceId,
      homeId,
      type: a.type,
      message: a.message,
      severity: a.severity,
      source: (source ?? "DEVICE") as any,
      status: "OPEN",
      triggeredAt: new Date(),
    })),
  });

  return { created: alarms.length };
}

export function mapAlarmDTO(e: any) {
  return {
    id: e.id,
    sensorDataId: e.sensorDataId ?? null,
    sensorReadingId: e.sensorReadingId ?? null,
    deviceId: e.deviceId,
    homeId: e.homeId,
    type: e.type,
    message: e.message,
    severity: e.severity,
    source: e.source,
    status: e.status,
    acknowledgedAt: e.acknowledgedAt ? e.acknowledgedAt.toISOString() : null,
    acknowledgedBy: e.acknowledgedBy ?? null,
    resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
    resolvedBy: e.resolvedBy ?? null,
    triggeredAt: e.triggeredAt.toISOString(),
  };
}

export async function listHomeAlarms(
  homeId: number,
  query: { from?: string; to?: string; status?: string; limit: number },
) {
  return prisma.alarmEvent.findMany({
    where: {
      homeId,
      triggeredAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
      status: query.status ? (query.status as any) : undefined,
    },
    orderBy: { triggeredAt: "desc" },
    take: Math.min(Math.max(query.limit, 1), 5000),
  });
}

export async function createHomeAlarm(homeId: number, body: any) {
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: { id: true },
  });
  if (!home) return { error: "HOME_NOT_FOUND" as const };

  const device = await prisma.device.findFirst({
    where: { id: body.deviceId, deletedAt: null },
    select: { id: true, homeId: true },
  });
  if (!device) return { error: "DEVICE_NOT_FOUND" as const };
  if (device.homeId !== homeId) return { error: "DEVICE_NOT_IN_HOME" as const };

  // sensorDataId / sensorReadingId optional:
  // kalau client tidak kirim, boleh auto pick latest sensorData atau sensorReading jika diminta.
  const sensorDataId = body.sensorDataId ?? null;
  const sensorReadingId = body.sensorReadingId ?? null;

  if (sensorDataId && sensorReadingId) {
    return { error: "AMBIGUOUS_SENSOR_REF" as const };
  }

  if (sensorDataId) {
    const sd = await prisma.sensorData.findFirst({
      where: { id: sensorDataId, deviceId: device.id },
      select: { id: true },
    });
    if (!sd) return { error: "SENSOR_DATA_NOT_FOUND" as const };
  }

  if (sensorReadingId) {
    const sr = await prisma.sensorReading.findFirst({
      where: { id: sensorReadingId, deviceId: device.id },
      select: { id: true },
    });
    if (!sr) return { error: "SENSOR_READING_NOT_FOUND" as const };
  }

  const alarm = await prisma.alarmEvent.create({
    data: {
      sensorDataId,
      sensorReadingId,
      deviceId: device.id,
      homeId: home.id,
      type: body.type,
      message: body.message,
      severity: body.severity,
      source: body.source ?? "BACKEND",
      triggeredAt: body.triggeredAt ? new Date(body.triggeredAt) : new Date(),
      status: "OPEN",
    },
  });

  return { alarm };
}

export async function acknowledgeAlarm(input: {
  homeId: number;
  alarmId: number;
  userId: number;
}) {
  // ensure alarm belongs to home
  const alarm = await prisma.alarmEvent.findFirst({
    where: { id: input.alarmId, homeId: input.homeId },
    select: { id: true, status: true },
  });
  if (!alarm) return { error: "NOT_FOUND" as const };
  if (alarm.status !== "OPEN") return { error: "INVALID_STATE" as const };

  const row = await prisma.alarmEvent.update({
    where: { id: input.alarmId },
    data: {
      status: "ACKED",
      acknowledgedAt: new Date(),
      acknowledgedBy: input.userId,
    },
  });

  return { alarm: row };
}

export async function resolveAlarm(input: {
  homeId: number;
  alarmId: number;
  userId: number;
}) {
  const alarm = await prisma.alarmEvent.findFirst({
    where: { id: input.alarmId, homeId: input.homeId },
    select: { id: true, status: true },
  });
  if (!alarm) return { error: "NOT_FOUND" as const };
  if (alarm.status === "RESOLVED") return { error: "INVALID_STATE" as const };

  const row = await prisma.alarmEvent.update({
    where: { id: input.alarmId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: input.userId,
    },
  });

  return { alarm: row };
}
