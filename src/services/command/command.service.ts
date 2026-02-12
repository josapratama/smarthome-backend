import { prisma } from "../../lib/prisma";
import { publishCommandById } from "../../mqtt/commands";
import crypto from "crypto";

type CommandSource = "USER" | "BACKEND" | "AI" | "ADMIN";

function uuid() {
  return crypto.randomUUID();
}

export async function createAndSendCommand(params: {
  deviceId: number;
  type: string;
  payload: unknown;
  requestedByUserId?: number | null;
  source?: CommandSource;
}) {
  const { deviceId, type, payload } = params;

  // device must exist and not soft-deleted
  const device = await prisma.device.findFirst({
    where: { id: deviceId, deletedAt: null },
    select: { id: true },
  });

  if (!device) return { error: "DEVICE_NOT_FOUND" as const };

  const cmd = await prisma.command.create({
    data: {
      deviceId,
      type,
      payload: payload as any,
      status: "PENDING",
      requestedBy: params.requestedByUserId ?? null,
      source: (params.source ??
        (params.requestedByUserId ? "USER" : "BACKEND")) as any,
      correlationId: uuid(), // @db.Uuid unique
    },
  });

  // publish + update status (publishCommandById kamu yang handle)
  await publishCommandById(cmd.id);

  // refresh
  const fresh = await prisma.command.findUnique({ where: { id: cmd.id } });
  return { cmd: fresh ?? cmd };
}

export async function getCommandById(commandId: number) {
  const cmd = await prisma.command.findUnique({ where: { id: commandId } });
  if (!cmd) return { error: "NOT_FOUND" as const };
  return { cmd };
}
