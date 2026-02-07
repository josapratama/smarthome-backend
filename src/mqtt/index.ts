import { getMqttClient } from "./client";
import { registerTelemetrySubscription } from "./telemetry";
import { registerCommandAckSubscription } from "./commands";

export function initMqttBridge() {
  const client = getMqttClient();

  // register subs
  registerTelemetrySubscription(client);
  registerCommandAckSubscription(client);

  return client;
}
