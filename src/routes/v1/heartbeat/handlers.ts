import type { Context } from "hono";
import { prisma } from "../../../lib/prisma";
import { toISO } from "../../../lib/to-iso";

type HeartbeatJson = {
  mqttClientId?: string;
};

function toDeviceDTO(device: {
  id: number;
  status: boolean;
  lastSeenAt: Date | null;
  mqttClientId: string | null;
}) {
  return {
    id: device.id,
    status: device.status,
    lastSeenAt: toISO(device.lastSeenAt),
    mqttClientId: device.mqttClientId,
  };
}

export async function postHeartbeatHandler(c: Context) {
  // deviceId sudah divalidasi oleh app.use middleware
  const deviceId = Number(c.req.param("deviceId"));
  const now = new Date();

  let body: HeartbeatJson = {};
  const contentType = c.req.header("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = (await c.req.json()) as HeartbeatJson;
    } catch {
      body = {};
    }
  }

  const updated = await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: true,
      lastSeenAt: now,
      ...(body.mqttClientId ? { mqttClientId: body.mqttClientId } : {}),
    },
    select: {
      id: true,
      status: true,
      lastSeenAt: true,
      mqttClientId: true,
    },
  });

  return c.json(
    {
      ok: true,
      serverTime: toISO(now),
      device: toDeviceDTO(updated),
    },
    200,
  );
}
