import type { MqttClient } from "mqtt";
import { prisma } from "../lib/prisma";
import { Topics, parseDeviceIdFromTopic } from "./topics";
import { z } from "zod";
import { getMqttClient } from "./client";

export async function publishCommandById(commandId: number) {
  const mqttClient = getMqttClient();

  const cmd = await prisma.command.findUnique({
    where: { id: commandId },
    select: {
      id: true,
      deviceId: true,
      type: true,
      payload: true,
      status: true,
    },
  });
  if (!cmd) return { error: "COMMAND_NOT_FOUND" as const };

  const topic = Topics.commands(cmd.deviceId);
  const message = JSON.stringify({
    commandId: cmd.id,
    type: cmd.type,
    payload: cmd.payload ?? {},
  });
  console.log("[mqtt] publishing command", cmd.id, "topic=", topic);

  // Wrap publish callback into Promise
  const ok = await new Promise<boolean>((resolve) => {
    mqttClient.publish(topic, message, { qos: 1, retain: false }, (err) => {
      resolve(!err);
    });
  });

  if (!ok) {
    await prisma.command.update({
      where: { id: cmd.id },
      data: { status: "FAILED", lastError: "MQTT_PUBLISH_FAILED" },
    });
    return { error: "MQTT_PUBLISH_FAILED" as const };
  }

  await prisma.command.update({
    where: { id: cmd.id },
    data: { status: "SENT", lastError: null },
  });

  console.log("[mqtt] publishing command", cmd.id, "topic=", topic);
  console.log("[mqtt] published command", cmd.id);

  return { ok: true as const };
}

const AckSchema = z.object({
  commandId: z.number().int(),
  status: z.enum(["ACKED", "FAILED"]),
  error: z.string().optional(),
});

export function registerCommandAckSubscription(mqttClient: MqttClient) {
  mqttClient.subscribe(Topics.commandsAckAll(), { qos: 1 }, (err) => {
    if (err) console.error("[mqtt] subscribe ack err:", err.message);
    else console.log("[mqtt] subscribed ack:", Topics.commandsAckAll());
  });

  mqttClient.on("message", async (topic, payloadBuf) => {
    if (!topic.endsWith("/commands/ack")) return;

    const deviceId = parseDeviceIdFromTopic(topic);
    if (!deviceId) return;

    let json: unknown;
    try {
      json = JSON.parse(payloadBuf.toString("utf8"));
    } catch {
      console.warn("[mqtt] ack invalid json topic=", topic);
      return;
    }

    const parsed = AckSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[mqtt] ack invalid schema topic=", topic);
      return;
    }

    const cmd = await prisma.command.findUnique({
      where: { id: parsed.data.commandId },
      select: { id: true, deviceId: true },
    });
    if (!cmd) return;
    if (cmd.deviceId !== deviceId) {
      console.warn("[mqtt] ack device mismatch commandId=", cmd.id);
      return;
    }

    await prisma.command.update({
      where: { id: cmd.id },
      data: {
        status: parsed.data.status,
        ackedAt: new Date(),
        lastError:
          parsed.data.status === "FAILED"
            ? (parsed.data.error ?? "UNKNOWN")
            : null,
      },
    });
  });
}
