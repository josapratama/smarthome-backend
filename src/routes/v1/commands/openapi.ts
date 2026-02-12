import { createRoute, z } from "@hono/zod-openapi";
import { CommandId, DeviceId } from "../common/ids";
import { CommandCreateBody, CommandDTO } from "./schemas";

// POST /api/v1/devices/{deviceId}/commands
export const createCommandRoute = createRoute({
  method: "post",
  path: "/api/v1/devices/{deviceId}/commands",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: { content: { "application/json": { schema: CommandCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: CommandDTO }) },
      },
      description: "Create a command and publish via MQTT.",
    },
    404: { description: "Device not found" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
  tags: ["Commands"],
});
export type CreateCommandRoute = typeof createCommandRoute;

// GET /api/v1/commands/{commandId}
export const getCommandRoute = createRoute({
  method: "get",
  path: "/api/v1/commands/{commandId}",
  request: { params: z.object({ commandId: CommandId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: CommandDTO }) },
      },
      description: "Get command status.",
    },
    404: { description: "Not found" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
  tags: ["Commands"],
});
export type GetCommandRoute = typeof getCommandRoute;
