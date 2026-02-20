import type { MqttClient } from "mqtt";
import { z } from "zod";

const RegistrationRequestSchema = z.object({
  mac: z.string(),
  type: z.string(),
  firmware: z.string(),
  ip: z.string(),
});

export function registerDeviceRegistrationSubscription(mqttClient: MqttClient) {
  const topic = "devices/register/request";

  mqttClient.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error("[mqtt][registration] subscribe error:", err.message);
    } else {
      console.log("[mqtt][registration] subscribed:", topic);
    }
  });

  mqttClient.on("message", async (msgTopic, payloadBuf) => {
    if (msgTopic !== topic) return;

    let json: unknown;
    try {
      json = JSON.parse(payloadBuf.toString("utf8"));
    } catch {
      console.warn("[mqtt][registration] invalid json");
      return;
    }

    const parsed = RegistrationRequestSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[mqtt][registration] invalid schema");
      return;
    }

    const { mac, type, firmware, ip } = parsed.data;

    console.log("[mqtt][registration] New device registration request:");
    console.log(`  MAC: ${mac}`);
    console.log(`  Type: ${type}`);
    console.log(`  Firmware: ${firmware}`);
    console.log(`  IP: ${ip}`);
    console.log("  → Admin needs to create device in backend");

    // TODO: Optional - Auto-create device or send notification to admin
    // For now, just log the request
  });
}
