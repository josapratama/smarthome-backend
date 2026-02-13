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

    // PZEM004 v3 additional fields
    voltageV: z.number().optional(),
    currentA: z.number().optional(),
    frequencyHz: z.number().optional(),
    powerFactor: z.number().optional(),

    // Power fields (existing)
    powerW: z.number().optional(),
    energyKwh: z.number().optional(),

    // Ultrasonic raw distance
    distanceCm: z.number().optional(),
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

        // PZEM004 v3 fields
        voltageV: parsed.data.data.voltageV ?? null,
        currentA: parsed.data.data.currentA ?? null,
        frequencyHz: parsed.data.data.frequencyHz ?? null,
        powerFactor: parsed.data.data.powerFactor ?? null,

        // Power fields
        powerW: parsed.data.data.powerW ?? null,
        energyKwh: parsed.data.data.energyKwh ?? null,

        // Ultrasonic distance
        distanceCm: parsed.data.data.distanceCm ?? null,

        timestamp: parsed.data.ts ? new Date(parsed.data.ts) : new Date(),
      },
    });
  });
}
