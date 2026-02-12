import type { Context, Next } from "hono";
import type { AppEnv } from "../types/app-env";
import { prisma } from "../lib/prisma";

export async function requireDeviceKey(
  c: Context<AppEnv>,
  next: Next,
  deviceId: number,
  deviceKey?: string,
) {
  const key = deviceKey ?? c.req.header("x-device-key");
  if (!key) return c.json({ error: "DEVICE_KEY_REQUIRED" }, 401);

  const device = await prisma.device.findFirst({
    where: { id: deviceId, deletedAt: null },
    select: {
      id: true,
      homeId: true,
      pairedByUserId: true,
      deviceKey: true,
    },
  });

  if (!device) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);
  if (!device.deviceKey) return c.json({ error: "DEVICE_KEY_NOT_SET" }, 401);
  if (device.deviceKey !== key)
    return c.json({ error: "INVALID_DEVICE_KEY" }, 401);

  // optional: set context var biar handler gak query lagi
  c.set("device", {
    id: device.id,
    homeId: device.homeId,
    userId: device.pairedByUserId,
  });

  return next();
}
