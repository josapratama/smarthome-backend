import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";
import { getMqttClient } from "../../../mqtt/client";
import { prisma } from "../../../lib/prisma";

const SendCredentialsSchema = z.object({
  mac: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  deviceId: z.number().int().positive(),
  deviceKey: z.string().min(1),
});

export function registerDeviceRegistrationRoutes(app: OpenAPIHono<AppEnv>) {
  // POST /api/v1/devices/register/send-credentials
  app.post(
    "/api/v1/devices/register/send-credentials",
    requireAuth,
    requireAdmin,
    async (c) => {
      try {
        const body = await c.req.json();
        const parsed = SendCredentialsSchema.safeParse(body);

        if (!parsed.success) {
          return c.json({ error: "Invalid request body" }, 400);
        }

        const { mac, deviceId, deviceKey } = parsed.data;

        // Verify device exists
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
          select: { id: true, capabilities: true, deletedAt: true },
        });

        if (!device || device.deletedAt) {
          return c.json({ error: "Device not found" }, 404);
        }

        // Check MAC address from capabilities JSON
        const deviceMac = (device.capabilities as any)?.mac;
        if (deviceMac && deviceMac !== mac) {
          return c.json({ error: "MAC address mismatch" }, 400);
        }

        // Publish MQTT command
        const mqttClient = getMqttClient();

        // Remove colons from MAC for topic
        const macClean = mac.replace(/:/g, "");

        // Try both topics: registration topic (for unregistered devices) and device-specific topic (for registered devices)
        const topics = [
          `devices/register/${macClean}`,
          `devices/${deviceId}/commands`,
        ];

        const payload = JSON.stringify({
          commandId: Date.now(), // Use timestamp as command ID
          type: "SET_CREDENTIALS",
          payload: {
            deviceId,
            deviceKey,
          },
        });

        // Publish to both topics
        for (const topic of topics) {
          await new Promise<void>((resolve, reject) => {
            mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        console.log(
          `[register] Sent credentials to device MAC=${mac} ID=${deviceId} (both topics)`,
        );

        return c.json({
          success: true,
          message: "Credentials sent to device",
          topics,
        });
      } catch (e: any) {
        console.error("[register] Error:", e);
        return c.json({ error: e?.message ?? "Internal error" }, 500);
      }
    },
  );
}
