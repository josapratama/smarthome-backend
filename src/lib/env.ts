import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  MQTT_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),

  PUBLIC_BASE_URL: z.string().optional(),
  STORAGE_DIR: z.string().default("storage"),
  OTA_TIMEOUT_MS: z.coerce.number().default(10 * 60 * 1000),
  OTA_SWEEP_INTERVAL_MS: z.coerce.number().default(30 * 1000),
});

export const envJwt = {
  PORT: Number(process.env.PORT ?? 3000),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me",
};

export const env = EnvSchema.parse(process.env);
