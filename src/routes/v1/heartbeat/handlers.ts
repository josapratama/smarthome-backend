import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { prisma } from "../../../lib/prisma";
import { toISO } from "../common/helpers";
import type { HeartbeatRoute } from "./openapi";

type HeartbeatJson = { mqttClientId?: string };

function toDeviceDTO(device: {
  id: number;
  status: boolean;
  lastSeenAt: Date | null;
  mqttClientId: string | null;
  updatedAt: Date;
}) {
  return {
    id: device.id,
    status: device.status,
    lastSeenAt: toISO(device.lastSeenAt),
    mqttClientId: device.mqttClientId,
    updatedAt: device.updatedAt.toISOString(),
  };
}

export const handleHeartbeat: RouteHandler<HeartbeatRoute, AppEnv> = async (
  c,
) => {
  const { deviceId } = c.req.valid("param");
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

  // Device sudah di-auth oleh middleware requireDeviceKey.
  // Tapi tetap aman: update only non-deleted
  const updated = await prisma.device.update({
    where: { id: Number(deviceId) },
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
      updatedAt: true,
    },
  });

  return c.json(
    {
      ok: true,
      serverTime: now.toISOString(),
      device: toDeviceDTO(updated),
    },
    200,
  );
};
