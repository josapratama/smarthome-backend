import { prisma } from "../../../lib/prisma";
import { toISO } from "../common/helpers";
import { publishCommandById } from "../../../mqtt/commands";

export function mapCommandDTO(cmd: any) {
  return {
    id: cmd.id,
    deviceId: cmd.deviceId,
    type: cmd.type,
    payload: cmd.payload,
    status: cmd.status,
    ackedAt: toISO(cmd.ackedAt),
    lastError: cmd.lastError ?? null,
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
  };
}

export async function createCommand(
  deviceId: number,
  body: { type: string; payload: any },
) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return { error: "DEVICE_NOT_FOUND" as const };

  const cmd = await prisma.command.create({
    data: {
      deviceId,
      type: body.type,
      payload: body.payload,
      status: "PENDING",
    },
  });

  // ✅ publish to MQTT, update status -> SENT / FAILED
  publishCommandById(cmd.id).catch((e) => {
    console.error("[mqtt] publishCommandById error:", e);
  });

  return { cmd };
}

export async function getCommandById(commandId: number) {
  const cmd = await prisma.command.findUnique({ where: { id: commandId } });
  if (!cmd) return { error: "NOT_FOUND" as const };
  return { cmd };
}
