import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { DeviceId } from "../common/ids";
import { SensorDataDTO, SensorDataIngestBody, TelemetryQuery } from "./schemas";
import {
  ingestTelemetry,
  getLatestTelemetry,
  queryTelemetry,
  mapSensorDTO,
} from "./handlers";

export function registerTelemetryRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/telemetry",
      request: {
        params: z.object({ deviceId: DeviceId }),
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
