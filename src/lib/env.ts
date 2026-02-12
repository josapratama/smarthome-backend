import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_SECRET: z.string().default("dev-secret-change-me"),

  // MQTT (optional)
  MQTT_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),

  // Public/base url (optional)
  PUBLIC_BASE_URL: z.string().optional(),

  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Storage
  STORAGE_DIR: z.string().default("storage"),

  // Command/Device/OTA timeouts
  COMMAND_ACK_TIMEOUT_MS: z.coerce.number().default(5000),
  COMMAND_TIMEOUT_SWEEP_INTERVAL_MS: z.coerce.number().default(1000),

  DEVICE_OFFLINE_THRESHOLD_MS: z.coerce.number().default(5000),
  DEVICE_OFFLINE_SWEEP_INTERVAL_MS: z.coerce.number().default(1000),

  OTA_TIMEOUT_MS: z.coerce.number().default(10 * 60 * 1000),
  OTA_SWEEP_INTERVAL_MS: z.coerce.number().default(30 * 1000),
});

export const env = EnvSchema.parse(process.env);

// Kalau kamu masih mau object khusus JWT (optional)
export const envJwt = {
  PORT: env.PORT,
  JWT_SECRET: env.JWT_SECRET,
};
