import { getMqttClient } from "./client";
import { registerTelemetrySubscription } from "./telemetry";
import { registerCommandAckSubscription } from "./commands";
import { registerHeartbeatSubscription } from "./heartbeat";
import { registerDeviceRegistrationSubscription } from "./registration";

export function initMqttBridge() {
  const client = getMqttClient();

  registerTelemetrySubscription(client);
  registerCommandAckSubscription();
  registerHeartbeatSubscription(client);
  registerDeviceRegistrationSubscription(client);

  return client;
}
