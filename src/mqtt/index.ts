import { getMqttClient } from "./client";
import { registerTelemetrySubscription } from "./telemetry";
import { registerCommandAckSubscription } from "./commands";

export function initMqttBridge() {
  const client = getMqttClient();

  // register once
  registerTelemetrySubscription(client);
  registerCommandAckSubscription(client);

  return client;
}
