import { z } from "zod";

const EnvSchema = z.object({
  MQTT_URL: z.string().min(1), // ex: "mqtt://localhost:1883"
  MQTT_CLIENT_ID: z.string().min(1).default("smarthome-backend"),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_CLEAN: z.coerce.boolean().default(true),
  MQTT_KEEPALIVE: z.coerce.number().default(30),
});

export type MqttConfig = z.infer<typeof EnvSchema>;

export function getMqttConfig(): MqttConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // jangan silent fail biar ketahuan saat startup
    throw new Error(`Invalid MQTT env: ${parsed.error.message}`);
  }
  return parsed.data;
}
