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
  summary: "Ingest sensor data",
  description:
    "Submit sensor readings from a device including power consumption, gas levels, flame detection, and other environmental data. Triggers alarm processing and AI analysis.",
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
      description: "Sensor data ingested successfully",
    },
    401: { description: "Unauthorized - invalid device key" },
    404: { description: "Device not found" },
  },
  tags: ["Sensor Data"],
});

export const getLatestTelemetryRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}/telemetry/latest",
  summary: "Get latest sensor reading",
  description:
    "Retrieve the most recent sensor data reading from a specific device including all available sensor metrics.",
  request: { params: z.object({ deviceId: DeviceId }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: SensorDataDTO.nullable() }),
        },
      },
      description: "Latest sensor data retrieved successfully",
    },
  },
  tags: ["Sensor Data"],
});

export const queryTelemetryRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}/telemetry",
  summary: "Query sensor data history",
  description:
    "Retrieve historical sensor data for a device with optional date range filtering and pagination. Useful for analytics and trend analysis.",
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
      description: "Sensor data history retrieved successfully",
    },
  },
  tags: ["Sensor Data"],
});
export type QueryTelemetryRoute = typeof queryTelemetryRoute;
