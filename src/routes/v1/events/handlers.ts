import { prisma } from "../../../lib/prisma";

export function mapAlarmDTO(e: any) {
  return {
    id: e.id,
    sensorId: e.sensorId,
    deviceId: e.deviceId,
    homeId: e.homeId ?? null,
    type: e.type,
    message: e.message,
    severity: e.severity,
    source: e.source,
    triggeredAt: e.triggeredAt.toISOString(),
  };
}

export async function listHomeEvents(
  homeId: number,
  query: { from?: string; to?: string; limit: number },
) {
  const events = await prisma.alarmEvent.findMany({
    where: {
      homeId,
      triggeredAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
    },
    orderBy: { triggeredAt: "desc" },
    take: query.limit,
  });

  return events;
}

export async function createHomeEvent(homeId: number, body: any) {
  const home = await prisma.home.findUnique({ where: { id: homeId } });
  if (!home) return { error: "HOME_NOT_FOUND" as const };

  const device = await prisma.device.findUnique({
    where: { id: body.deviceId },
  });
  if (!device) return { error: "DEVICE_NOT_FOUND" as const };
  if (device.homeId !== homeId) return { error: "DEVICE_NOT_IN_HOME" as const };

  let sensorId = body.sensorId as number | undefined;
  if (!sensorId) {
    const latest = await prisma.sensorData.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: "desc" },
    });
    if (!latest) return { error: "NO_SENSOR_DATA" as const };
    sensorId = latest.id;
  }

  const alarm = await prisma.alarmEvent.create({
    data: {
      sensorId,
      deviceId: device.id,
      homeId,
      type: body.type,
      message: body.message,
      severity: body.severity,
      source: body.source,
      triggeredAt: body.triggeredAt ? new Date(body.triggeredAt) : new Date(),
    },
  });

  return { alarm };
}
