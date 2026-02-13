import { createRoute, z } from "@hono/zod-openapi";
import { CommandId, DeviceId } from "../common/ids";
import { CommandCreateBody, CommandDTO } from "./schemas";

// POST /api/v1/devices/{deviceId}/commands
export const createCommandRoute = createRoute({
  method: "post",
  path: "/api/v1/devices/{deviceId}/commands",
  summary: "Send command to device",
  description:
    "Send a control command to a device via MQTT. Commands include turning devices on/off, adjusting settings, or triggering specific actions. Returns command tracking information.",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: CommandCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: CommandDTO }) },
      },
      description: "Command sent successfully and queued for delivery",
    },
    404: { description: "Device not found" },
    401: { description: "Unauthorized - invalid or missing token" },
    403: {
      description: "Forbidden - insufficient permissions for this device",
    },
  },
  tags: ["Device Control"],
});

// GET /api/v1/commands/{commandId}
export const getCommandRoute = createRoute({
  method: "get",
  path: "/api/v1/commands/{commandId}",
  summary: "Get command status",
  description:
    "Retrieve the current status and execution details of a previously sent command including delivery confirmation and response from device.",
  request: { params: z.object({ commandId: CommandId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: CommandDTO }) },
      },
      description: "Command status retrieved successfully",
    },
    404: { description: "Command not found" },
    401: { description: "Unauthorized - invalid or missing token" },
    403: {
      description: "Forbidden - insufficient permissions for this command",
    },
  },
  tags: ["Device Control"],
});
