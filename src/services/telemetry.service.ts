import { prisma } from "../lib/prisma";
import { processAlarmsFromTelemetry } from "./alarm.service";

type TelemetryInput = {
  current?: number;
  gasPpm?: number;
  flame?: boolean;
  binLevel?: number;
  timestamp?: string | Date;
};

export async function ingestTelemetry(params: {
  deviceId: number; // Int
  homeId?: number | null; // Int?
  telemetry: TelemetryInput;
}) {
  const { deviceId, homeId, telemetry } = params;

  const ts =
    telemetry.timestamp instanceof Date
      ? telemetry.timestamp
      : telemetry.timestamp
        ? new Date(telemetry.timestamp)
        : new Date();

  // SensorData fields wajib -> kasih default
  const current = telemetry.current ?? 0;
  const gasPpm = telemetry.gasPpm ?? 0;
  const flame = telemetry.flame ?? false;
  const binLevel = telemetry.binLevel ?? 0;

  // 1) Insert sensor_data
  const sensor = await prisma.sensorData.create({
    data: {
      deviceId,
      current,
      gasPpm,
      flame,
      binLevel,
      timestamp: ts,
    },
  });

  // 2) Update device_status online + lastSeenAt
  await prisma.device.update({
    where: { id: deviceId },
    data: { status: true, lastSeenAt: new Date() },
  });

  // 3) Alarm engine + dedup
  await processAlarmsFromTelemetry({
    sensorId: sensor.id,
    deviceId,
    homeId: homeId ?? null,
    source: "DEVICE",
    telemetry: { current, gasPpm, flame, binLevel },
  });

  return sensor;
}
