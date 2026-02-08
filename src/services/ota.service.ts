import { prisma } from "../lib/prisma";
import mqtt from "mqtt";

type MqttPublishOptions = {
  qos?: 0 | 1 | 2;
  retain?: boolean;
};

function getMqttClient() {
  const url = process.env.MQTT_URL ?? "mqtt://localhost:1883";
  const username = process.env.MQTT_USERNAME || undefined;
  const password = process.env.MQTT_PASSWORD || undefined;

  const client = mqtt.connect(url, {
    username,
    password,
    reconnectPeriod: 2000,
  });

  return client;
}

async function mqttPublishJson(
  topic: string,
  payload: unknown,
  opts?: MqttPublishOptions,
) {
  const client = getMqttClient();
  await new Promise<void>((resolve, reject) => {
    client.on("connect", () => {
      const body = JSON.stringify(payload);
      client.publish(
        topic,
        body,
        { qos: opts?.qos ?? 1, retain: opts?.retain ?? false },
        (err) => {
          client.end(true);
          if (err) reject(err);
          else resolve();
        },
      );
    });
    client.on("error", (e) => {
      client.end(true);
      reject(e);
    });
  });
}

function baseUrlFromRequestOrEnv(requestUrl: string) {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase && envBase.trim()) return envBase.replace(/\/+$/, "");
  const u = new URL(requestUrl);
  return `${u.protocol}//${u.host}`;
}

export class OtaService {
  static async triggerDeviceOta(params: {
    requestUrl: string; // c.req.url
    deviceId: number;
    releaseId: number;
  }) {
    const device = await prisma.device.findUnique({
      where: { id: params.deviceId },
    });
    if (!device) throw new Error("Device not found");

    const release = await prisma.firmwareRelease.findUnique({
      where: { id: params.releaseId },
    });
    if (!release) throw new Error("Firmware release not found");

    // 1) create OtaJob
    const otaJob = await prisma.otaJob.create({
      data: {
        deviceId: device.id,
        releaseId: release.id,
        status: "PENDING",
      },
    });

    // 2) create Command
    const baseUrl = baseUrlFromRequestOrEnv(params.requestUrl);
    const downloadUrl = `${baseUrl}/api/v1/firmware/releases/${release.id}/download`;

    const commandPayload = {
      otaJobId: otaJob.id,
      release: {
        id: release.id,
        platform: release.platform,
        version: release.version,
        sha256: release.sha256,
        sizeBytes: release.sizeBytes,
        url: downloadUrl,
      },
    };

    const command = await prisma.command.create({
      data: {
        deviceId: device.id,
        type: "OTA_UPDATE",
        payload: commandPayload as any,
        status: "PENDING",
      },
    });

    // 3) link OtaJob -> Command (audit)
    await prisma.otaJob.update({
      where: { id: otaJob.id },
      data: { commandId: command.id },
    });

    // 4) publish via MQTT (topic command sesuai pola umum kamu)
    // Sesuaikan topic kalau di project kamu beda:
    const topic = `devices/${device.id}/commands`;

    const mqttEnvelope = {
      commandId: command.id,
      type: command.type,
      issuedAt: new Date().toISOString(),
      data: commandPayload,
    };

    try {
      await mqttPublishJson(topic, mqttEnvelope, { qos: 1 });

      // update statuses
      await prisma.command.update({
        where: { id: command.id },
        data: { status: "SENT" },
      });

      await prisma.otaJob.update({
        where: { id: otaJob.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return {
        otaJobId: otaJob.id,
        commandId: command.id,
        status: "SENT" as const,
      };
    } catch (err: any) {
      const msg = err?.message ?? "MQTT publish failed";

      await prisma.command.update({
        where: { id: command.id },
        data: { status: "FAILED", lastError: msg },
      });

      await prisma.otaJob.update({
        where: { id: otaJob.id },
        data: { status: "FAILED", lastError: msg, failedAt: new Date() },
      });

      throw new Error(msg);
    }
  }

  static async getOtaJobOrThrow(otaJobId: number) {
    const job = await prisma.otaJob.findUnique({
      where: { id: otaJobId },
      include: { release: true, device: true, command: true },
    });
    if (!job) throw new Error("OTA job not found");
    return job;
  }

  static async listDeviceOtaJobs(deviceId: number, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    return prisma.otaJob.findMany({
      where: { deviceId },
      include: { release: true, command: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
