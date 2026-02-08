import { prisma } from "../../../lib/prisma";
import { toISO } from "../common/helpers";
import { publishCommandById } from "../../../mqtt/commands";
import { createAndSendCommand } from "../../../services/command.service";

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
  body: { type: string; payload: unknown },
) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { id: true },
  });
  if (!device) return { error: "Device not found" as const };

  const cmd = await createAndSendCommand({
    deviceId,
    type: body.type,
    payload: body.payload,
  });

  const fresh = await prisma.command.findUnique({ where: { id: cmd.id } });
  return { cmd: fresh ?? cmd };
}

export async function getCommandById(commandId: number) {
  const cmd = await prisma.command.findUnique({ where: { id: commandId } });
  if (!cmd) return { error: "Not found" as const };
  return { cmd };
}
