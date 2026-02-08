import mqtt from "mqtt";
import { prisma } from "../lib/prisma";

type OtaProgressPayload = {
  otaJobId: number;
  status: "DOWNLOADING" | "APPLIED" | "FAILED";
  progress?: number;
  error?: string;
};

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function startOtaProgressSubscriber() {
  const url = process.env.MQTT_URL ?? "mqtt://localhost:1883";
  const username = process.env.MQTT_USERNAME || undefined;
  const password = process.env.MQTT_PASSWORD || undefined;

  const client = mqtt.connect(url, {
    username,
    password,
    reconnectPeriod: 2000,
  });

  client.on("connect", () => {
    console.log("[mqtt][ota] connected");
    // devices/+/ota/progress
    client.subscribe("devices/+/ota/progress", { qos: 1 }, (err) => {
      if (err) console.error("[mqtt][ota] subscribe error", err);
      else console.log("[mqtt][ota] subscribed devices/+/ota/progress");
    });
  });

  client.on("message", async (_topic, message) => {
    const txt = message.toString("utf-8");
    const payload = safeJsonParse<OtaProgressPayload>(txt);
    if (!payload) return;

    const otaJobId = Number(payload.otaJobId);
    if (!Number.isFinite(otaJobId)) return;

    const data: any = {
      progress:
        typeof payload.progress === "number" &&
        payload.progress >= 0 &&
        payload.progress <= 1
          ? payload.progress
          : undefined,
      lastError: payload.error ?? undefined,
    };
    console.log("[mqtt][ota] message", _topic, txt);

    if (payload.status === "DOWNLOADING") {
      data.status = "DOWNLOADING";
      data.downloadingAt = new Date();
    } else if (payload.status === "APPLIED") {
      data.status = "APPLIED";
      data.appliedAt = new Date();
      data.progress = 1.0;
    } else if (payload.status === "FAILED") {
      data.status = "FAILED";
      data.failedAt = new Date();
    } else {
      return;
    }

    try {
      await prisma.otaJob.update({
        where: { id: otaJobId },
        data,
      });
    } catch (e) {
      // job mungkin sudah tidak ada / id salah
      console.error("[mqtt][ota] update otaJob failed", e);
    }
  });

  client.on("error", (e) => console.error("[mqtt][ota] client error", e));

  return client;
}
