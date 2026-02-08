import { getMqttClient } from "./client";
import { registerTelemetrySubscription } from "./telemetry";
import { registerCommandAckSubscription } from "./commands";
import { registerHeartbeatSubscription } from "./heartbeat";

export function initMqttBridge() {
  const client = getMqttClient();

  registerTelemetrySubscription(client);
  registerCommandAckSubscription();
  registerHeartbeatSubscription(client);

  return client;
}
