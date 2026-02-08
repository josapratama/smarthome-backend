import type { MqttClient } from "mqtt";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getMqttClient } from "./client";
import { Topics, parseDeviceIdFromTopic } from "./topics";
import { withRetry } from "./retry";

// ---- Config via env (optional) ----
function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const PUBLISH_RETRIES = envInt("MQTT_PUBLISH_RETRIES", 3);
const PUBLISH_BACKOFFS = [
  envInt("MQTT_PUBLISH_BACKOFF_1_MS", 500),
  envInt("MQTT_PUBLISH_BACKOFF_2_MS", 1000),
  envInt("MQTT_PUBLISH_BACKOFF_3_MS", 2000),
];

// ---- Helpers ----
function shouldRetryPublish(err: unknown) {
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes("MQTT_NOT_CONNECTED") ||
    msg.includes("Not connected") ||
    msg.includes("ECONN") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EPIPE")
  );
}

function publishOnce(
  mqttClient: MqttClient,
  topic: string,
  message: string,
  opts: { qos?: 0 | 1; retain?: boolean } = {},
) {
  const qos = opts.qos ?? 1;
  const retain = opts.retain ?? false;

  return new Promise<void>((resolve, reject) => {
    mqttClient.publish(topic, message, { qos, retain }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Publish command by id:
 * - retry publish (0.5s, 1s, 2s)
 * - status update idempotent:
 *    - SUCCESS: only PENDING -> SENT
 *    - FAIL:    only PENDING -> FAILED
 */
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

  // Optional safety: only allow publishing when PENDING
  // (kalau kamu mau allow retry dari FAILED, ubah jadi in: ["PENDING","FAILED"])
  if (cmd.status !== "PENDING") {
    return { error: "COMMAND_NOT_PENDING" as const, status: cmd.status };
  }

  const topic = Topics.commands(cmd.deviceId);
  const message = JSON.stringify({
    commandId: cmd.id, // Int
    type: cmd.type,
    payload: cmd.payload ?? {},
  });

  console.log("[mqtt] publishing command", cmd.id, "topic=", topic);

  const ok = await withRetry(
    async () => {
      if (!mqttClient.connected) throw new Error("MQTT_NOT_CONNECTED");
      await publishOnce(mqttClient, topic, message, { qos: 1, retain: false });
      return true;
    },
    {
      retries: PUBLISH_RETRIES,
      delaysMs: PUBLISH_BACKOFFS,
      shouldRetry: shouldRetryPublish,
    },
  )
    .then(() => true)
    .catch((err) => {
      console.error(
        "[mqtt] publish failed commandId=",
        cmd.id,
        "err=",
        String((err as any)?.message ?? err),
      );
      return false;
    });

  if (!ok) {
    // Idempotent: hanya update kalau masih PENDING
    await prisma.command.updateMany({
      where: { id: cmd.id, status: "PENDING" },
      data: { status: "FAILED", lastError: "MQTT_PUBLISH_FAILED" },
    });
    return { error: "MQTT_PUBLISH_FAILED" as const };
  }

  // Idempotent: hanya update kalau masih PENDING
  await prisma.command.updateMany({
    where: { id: cmd.id, status: "PENDING" },
    data: { status: "SENT", lastError: null },
  });

  console.log("[mqtt] published command", cmd.id);
  return { ok: true as const };
}

// ---- ACK subscription ----
const AckSchema = z.object({
  commandId: z.number().int(),
  status: z.enum(["ACKED", "FAILED"]),
  error: z.string().optional(),
});

let ackSubscribed = false;

/**
 * Register ACK subscription once.
 * Tidak butuh parameter mqttClient (hindari TS "Cannot find name mqttClient")
 */
export function registerCommandAckSubscription() {
  if (ackSubscribed) return;
  ackSubscribed = true;

  const mqttClient = getMqttClient();

  mqttClient.subscribe(Topics.commandsAckAll(), { qos: 1 }, (err) => {
    if (err) console.error("[mqtt] subscribe ack err:", err.message);
    else console.log("[mqtt] subscribed ack:", Topics.commandsAckAll());
  });

  mqttClient.on("message", async (topic, payloadBuf) => {
    if (!topic.startsWith("devices/")) return;
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
      console.warn(
        "[mqtt] ack invalid schema topic=",
        topic,
        parsed.error.issues,
      );
      return;
    }

    const commandId = parsed.data.commandId;

    const cmd = await prisma.command.findUnique({
      where: { id: commandId },
      select: { id: true, deviceId: true, status: true },
    });
    if (!cmd) return;

    if (cmd.deviceId !== deviceId) {
      console.warn("[mqtt] ack device mismatch commandId=", cmd.id);
      return;
    }

    const updateRes = await prisma.command.updateMany({
      where: { id: cmd.id, status: { in: ["SENT", "TIMEOUT"] } },
      data: {
        status: parsed.data.status,
        ackedAt: new Date(),
        lastError:
          parsed.data.status === "FAILED"
            ? (parsed.data.error ?? "UNKNOWN")
            : null,
      },
    });

    if (updateRes.count === 0) {
      console.log(
        "[mqtt] ack ignored (not SENT) commandId=",
        cmd.id,
        "currentStatus=",
        cmd.status,
      );
      return;
    }

    console.log(
      "[mqtt] ack applied commandId=",
      cmd.id,
      "status=",
      parsed.data.status,
    );
  });
}
