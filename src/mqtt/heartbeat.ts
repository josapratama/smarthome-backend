import type { MqttClient } from "mqtt";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Topics, parseDeviceIdFromTopic } from "./topics";

const HeartbeatSchema = z.object({
  deviceKey: z.string().min(1),
  mqttClientId: z.string().min(1).optional(),
});

export function registerHeartbeatSubscription(mqttClient: MqttClient) {
  mqttClient.subscribe(Topics.heartbeatAll(), { qos: 1 }, (err) => {
    if (err) console.error("[mqtt] subscribe heartbeat err:", err.message);
    else console.log("[mqtt] subscribed heartbeat:", Topics.heartbeatAll());
  });

  mqttClient.on("message", async (topic, payloadBuf) => {
    if (!topic.startsWith("devices/")) return;
    if (!topic.endsWith("/heartbeat")) return;

    const deviceId = parseDeviceIdFromTopic(topic);
    if (!deviceId) return;

    let json: unknown;
    try {
      json = JSON.parse(payloadBuf.toString("utf8"));
    } catch {
      console.warn("[mqtt] heartbeat invalid json topic=", topic);
      return;
    }

    const parsed = HeartbeatSchema.safeParse(json);
    if (!parsed.success) {
      console.warn(
        "[mqtt] heartbeat invalid schema topic=",
        topic,
        parsed.error.issues,
      );
      return;
    }

    const now = new Date();
    const mqttClientId = parsed.data.mqttClientId;

    // ✅ Atomic update: only succeeds if deviceId exists AND deviceKey matches
    const res = await prisma.device.updateMany({
      where: {
        id: deviceId,
        deviceKey: parsed.data.deviceKey,
      },
      data: {
        status: true,
        lastSeenAt: now,
        ...(mqttClientId ? { mqttClientId } : {}),
      },
    });

    if (res.count === 0) {
      console.warn(
        "[mqtt] heartbeat ignored (deviceKey mismatch or device not found) deviceId=",
        deviceId,
      );
      return;
    }

    console.log("[mqtt] heartbeat ok deviceId=", deviceId);
  });
}
