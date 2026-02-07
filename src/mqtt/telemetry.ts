import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parseDeviceIdFromTopic, Topics } from "./topics";
import type { MqttClient } from "mqtt";

const TelemetryMqttSchema = z.object({
  deviceKey: z.string().min(1),
  ts: z.number().int().optional(), // epoch ms optional
  data: z.object({
    current: z.number(),
    gasPpm: z.number(),
    flame: z.boolean(),
    binLevel: z.number(),
  }),
});

export function registerTelemetrySubscription(mqttClient: MqttClient) {
  mqttClient.subscribe(Topics.telemetryAll(), { qos: 1 }, (err) => {
    if (err) console.error("[mqtt] subscribe telemetry err:", err.message);
    else console.log("[mqtt] subscribed telemetry:", Topics.telemetryAll());
  });

  mqttClient.on("message", async (topic, payloadBuf) => {
    if (!topic.endsWith("/telemetry")) return;

    const deviceId = parseDeviceIdFromTopic(topic);
    if (!deviceId) return;

    let json: unknown;
    try {
      json = JSON.parse(payloadBuf.toString("utf8"));
    } catch {
      console.warn("[mqtt] telemetry invalid json topic=", topic);
      return;
    }

    const parsed = TelemetryMqttSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[mqtt] telemetry invalid schema topic=", topic);
      return;
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true, deviceKey: true },
    });
    if (!device) return;

    if (!device.deviceKey || device.deviceKey !== parsed.data.deviceKey) {
      console.warn("[mqtt] telemetry invalid deviceKey id=", deviceId);
      return;
    }

    // update online marker
    await prisma.device.update({
      where: { id: deviceId },
      data: { status: true, lastSeenAt: new Date() },
    });

    // simpan ke SensorData
    await prisma.sensorData.create({
      data: {
        deviceId,
        current: parsed.data.data.current,
        gasPpm: parsed.data.data.gasPpm,
        flame: parsed.data.data.flame,
        binLevel: parsed.data.data.binLevel,
        timestamp: parsed.data.ts ? new Date(parsed.data.ts) : new Date(),
      },
    });
  });
}
