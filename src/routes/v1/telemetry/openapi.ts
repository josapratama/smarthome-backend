import { createRoute, z } from "@hono/zod-openapi";
import { DeviceId } from "../common/ids";
import {
  DeviceKeyHeaderOptionalSchema,
  SensorDataDTO,
  SensorDataIngestBody,
  TelemetryQuery,
} from "./schemas";

export const ingestTelemetryRoute = createRoute({
  method: "post",
  path: "/api/v1/devices/{deviceId}/telemetry",
  request: {
    params: z.object({ deviceId: DeviceId }),
    headers: DeviceKeyHeaderOptionalSchema,
    body: { content: { "application/json": { schema: SensorDataIngestBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: SensorDataDTO }) },
      },
      description: "Ingest sensor snapshot (HTTP).",
    },
    401: { description: "Unauthorized (device key invalid)" },
    404: { description: "Device not found" },
  },
  tags: ["Telemetry"],
});
export type IngestTelemetryRoute = typeof ingestTelemetryRoute;

export const getLatestTelemetryRoute = createRoute({
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
  tags: ["Telemetry"],
});
export type GetLatestTelemetryRoute = typeof getLatestTelemetryRoute;

export const queryTelemetryRoute = createRoute({
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
      description: "Query telemetry history (sensor_data).",
    },
  },
  tags: ["Telemetry"],
});
export type QueryTelemetryRoute = typeof queryTelemetryRoute;
