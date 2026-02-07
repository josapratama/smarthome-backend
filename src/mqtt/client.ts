import mqtt, { type MqttClient } from "mqtt";
import { getMqttConfig } from "./config";

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (client) return client;

  const cfg = getMqttConfig();

  client = mqtt.connect(cfg.MQTT_URL, {
    clientId: cfg.MQTT_CLIENT_ID,
    username: cfg.MQTT_USERNAME,
    password: cfg.MQTT_PASSWORD,
    clean: cfg.MQTT_CLEAN,
    keepalive: cfg.MQTT_KEEPALIVE,
    reconnectPeriod: 2_000, // 2s reconnect
    connectTimeout: 10_000,
  });

  client.on("connect", () => {
    console.log("[mqtt] connected");
  });
  client.on("reconnect", () => {
    console.log("[mqtt] reconnecting...");
  });
  client.on("close", () => {
    console.log("[mqtt] closed");
  });
  client.on("error", (err) => {
    console.error("[mqtt] error:", err.message);
  });

  return client;
}
