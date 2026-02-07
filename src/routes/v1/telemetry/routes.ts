import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { DeviceId } from "../common/ids";
import { SensorDataDTO, SensorDataIngestBody, TelemetryQuery } from "./schemas";
import {
  ingestTelemetry,
  getLatestTelemetry,
  queryTelemetry,
  mapSensorDTO,
} from "./handlers";
import { requireDeviceKey } from "../../../middlewares/device-auth";

export function registerTelemetryRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/telemetry",
      request: {
        params: z.object({ deviceId: DeviceId }),
        headers: z.object({
          "x-device-key": z.string().optional(),
        }),

        body: {
          content: { "application/json": { schema: SensorDataIngestBody } },
        },
      },

      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: SensorDataDTO }) },
          },
          description:
            "Ingest sensor snapshot (HTTP). MQTT devices biasanya masuk lewat consumer yang nanti kita buat.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      console.log("🔥 TELEMETRY POST HIT", {
        deviceId,
        rawHeader: c.req.header("x-device-key"),
      });

      const headers = c.req.valid("header");
      const deviceKey = headers["x-device-key"];

      const authRes = await requireDeviceKey(
        c,
        async () => {},
        deviceId,
        deviceKey,
      );
      if (authRes) return authRes;

      const body = c.req.valid("json");

      const res = await ingestTelemetry(deviceId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapSensorDTO(res.row) }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/telemetry/latest",
      request: { params: z.object({ deviceId: DeviceId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: SensorDataDTO.nullable() }),
            },
          },
          description: "Get latest sensor snapshot.",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const row = await getLatestTelemetry(deviceId);
      if (!row) return c.json({ data: null });
      return c.json({ data: mapSensorDTO(row) });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/telemetry",
      request: {
        params: z.object({ deviceId: DeviceId }),
        query: TelemetryQuery,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(SensorDataDTO) }),
            },
          },
          description: "Query telemetry history (sensor_data snapshots).",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const { from, to, limit } = c.req.valid("query");

      const rows = await queryTelemetry(deviceId, { from, to, limit });
      return c.json({ data: rows.map(mapSensorDTO) });
    },
  );
}
