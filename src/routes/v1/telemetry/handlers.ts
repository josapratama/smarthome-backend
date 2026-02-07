import { prisma } from "../../../lib/prisma";

export function mapSensorDTO(r: any) {
  return {
    id: r.id,
    deviceId: r.deviceId,
    current: r.current,
    gasPpm: r.gasPpm,
    flame: r.flame,
    binLevel: r.binLevel,
    timestamp: r.timestamp.toISOString(),
  };
}

export async function ingestTelemetry(deviceId: number, body: any) {
  const device = await prisma.device
    .update({
      where: { id: deviceId },
      data: { status: true, lastSeenAt: new Date() },
    })
    .catch(() => null);

  if (!device) return { error: "DEVICE_NOT_FOUND" as const };

  const row = await prisma.sensorData.create({
    data: {
      deviceId,
      current: body.current,
      gasPpm: body.gasPpm,
      flame: body.flame,
      binLevel: body.binLevel,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    },
  });

  return { row };
}

export async function getLatestTelemetry(deviceId: number) {
  const row = await prisma.sensorData.findFirst({
    where: { deviceId },
    orderBy: { timestamp: "desc" },
  });
  return row ?? null;
}

export async function queryTelemetry(
  deviceId: number,
  query: { from?: string; to?: string; limit: number },
) {
  const rows = await prisma.sensorData.findMany({
    where: {
      deviceId,
      timestamp: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
    },
    orderBy: { timestamp: "desc" },
    take: query.limit,
  });

  return rows;
}
