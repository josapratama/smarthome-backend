export const Topics = {
  telemetry: (deviceId: number) => `devices/${deviceId}/telemetry`,
  commands: (deviceId: number) => `devices/${deviceId}/commands`,
  commandsAck: (deviceId: number) => `devices/${deviceId}/commands/ack`,

  // wildcard
  telemetryAll: () => `devices/+/telemetry`,
  commandsAckAll: () => `devices/+/commands/ack`,

  heartbeat: (deviceId: number) => `devices/${deviceId}/heartbeat`,
  heartbeatAll: () => `devices/+/heartbeat`,
};

export function parseDeviceIdFromTopic(topic: string): number | null {
  // devices/{id}/telemetry  OR devices/{id}/commands/ack
  const parts = topic.split("/");
  if (parts.length < 3) return null;
  if (parts[0] !== "devices") return null;

  const id = Number(parts[1]);
  return Number.isFinite(id) ? id : null;
}
