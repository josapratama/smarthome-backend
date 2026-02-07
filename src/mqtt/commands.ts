import type { MqttClient } from "mqtt";
import { prisma } from "../lib/prisma";
import { Topics, parseDeviceIdFromTopic } from "./topics";
import { z } from "zod";

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
