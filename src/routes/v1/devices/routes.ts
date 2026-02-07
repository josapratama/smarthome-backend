import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { DeviceId, HomeId } from "../common/ids";
import { DeviceCreateBody, DeviceDTO, DeviceUpdateBody } from "./schemas";
import {
  listDevicesByHome,
  createDeviceUnderHome,
  getDeviceById,
  patchDevice,
  mapDeviceDTO,
} from "./handlers";

export function registerDevicesRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}/devices",
      request: { params: z.object({ homeId: HomeId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(DeviceDTO) }),
            },
          },
          description: "List devices for a home.",
        },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const devices = await listDevicesByHome(homeId);
      return c.json({ data: devices.map(mapDeviceDTO) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/homes/{homeId}/devices",
      request: {
        params: z.object({ homeId: HomeId }),
        body: { content: { "application/json": { schema: DeviceCreateBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description:
            "Create device under a home (userId inferred from home owner).",
        },
        404: { description: "Home not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createDeviceUnderHome(homeId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapDeviceDTO(res.device) }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}",
      request: { params: z.object({ deviceId: DeviceId }) },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description: "Get device details.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const res = await getDeviceById(deviceId);
      if ("error" in res) return c.json({ error: res.error }, 404);
      return c.json({ data: mapDeviceDTO(res.device) });
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/devices/{deviceId}",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: { content: { "application/json": { schema: DeviceUpdateBody } } },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description: "Update device (name/room/status/lastSeenAt/keys).",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await patchDevice(deviceId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapDeviceDTO(res.device) });
    },
  );
}
