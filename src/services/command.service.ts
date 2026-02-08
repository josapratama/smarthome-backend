import { prisma } from "../lib/prisma";
import { publishCommandById } from "../mqtt/commands";

export async function createAndSendCommand(params: {
  deviceId: number;
  type: string;
  payload: unknown;
}) {
  const { deviceId, type, payload } = params;

  const cmd = await prisma.command.create({
    data: {
      deviceId,
      type,
      payload: payload as any,
      status: "PENDING",
    },
  });

  // publish + update status SENT/FAILED dengan retry & idempotent
  await publishCommandById(cmd.id);

  // return cmd (route kamu sudah re-fetch fresh)
  return cmd;
}
