import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CommandId, DeviceId } from "../common/ids";
import { CommandCreateBody, CommandDTO } from "./schemas";
import { createCommand, getCommandById, mapCommandDTO } from "./handlers";

export function registerCommandsRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/commands",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: { "application/json": { schema: CommandCreateBody } },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: CommandDTO }) },
          },
          description:
            "Create a command record. Nanti kita sambungkan ke MQTT publisher + ack handler supaya status berubah SENT/ACKED.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createCommand(deviceId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapCommandDTO(res.cmd) }, 201);
    },
  );

  app.openapi(
    createRoute({
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
      },
    }),
    async (c) => {
      const { commandId } = c.req.valid("param");
      const res = await getCommandById(commandId);
      if ("error" in res) return c.json({ error: res.error }, 404);
      return c.json({ data: mapCommandDTO(res.cmd) });
    },
  );
}
