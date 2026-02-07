import { prisma } from "../../../lib/prisma";
import { toISO } from "../common/helpers";

export function mapDeviceDTO(d: any) {
  return {
    id: d.id,
    deviceName: d.deviceName,
    room: d.room ?? null,
    status: d.status,
    updatedAt: d.updatedAt.toISOString(),
    lastSeenAt: toISO(d.lastSeenAt),
    mqttClientId: d.mqttClientId ?? null,
    userId: d.userId,
    homeId: d.homeId ?? null,
  };
}

export async function listDevicesByHome(homeId: number) {
  return prisma.device.findMany({
    where: { homeId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createDeviceUnderHome(homeId: number, input: any) {
  const home = await prisma.home.findUnique({ where: { id: homeId } });
  if (!home) return { error: "HOME_NOT_FOUND" as const };

  const device = await prisma.device.create({
    data: {
      homeId: home.id,
      userId: home.ownerId,
      deviceName: input.deviceName,
      room: input.room,
      mqttClientId: input.mqttClientId,
      deviceKey: input.deviceKey,
      status: false,
    },
  });

  return { device };
}

export async function getDeviceById(deviceId: number) {
  const d = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!d) return { error: "NOT_FOUND" as const };
  return { device: d };
}

export async function patchDevice(deviceId: number, body: any) {
  const d = await prisma.device
    .update({
      where: { id: deviceId },
      data: {
        deviceName: body.deviceName,
        room: body.room,
        status: body.status,
        lastSeenAt: body.lastSeenAt ? new Date(body.lastSeenAt) : undefined,
        mqttClientId: body.mqttClientId,
        deviceKey: body.deviceKey,
        homeId: body.homeId,
      },
    })
    .catch(() => null);

  if (!d) return { error: "NOT_FOUND" as const };
  return { device: d };
}
