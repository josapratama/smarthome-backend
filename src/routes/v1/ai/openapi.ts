import { createRoute, z } from "@hono/zod-openapi";
import { DeviceId, PredictionId } from "../common/ids";
import {
  EnergyPredictionCreateBody,
  EnergyPredictionDTO,
  AnomalyCreateBody,
  AnomalyDTO,
  LimitQuery,
} from "./schemas";

// POST /api/v1/devices/{deviceId}/energy-predictions
export const createEnergyPredictionRoute = createRoute({
  method: "post",
  path: "/api/v1/devices/{deviceId}/energy-predictions",
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: {
      content: { "application/json": { schema: EnergyPredictionCreateBody } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: EnergyPredictionDTO }) },
      },
      description: "Create energy prediction record.",
    },
    404: { description: "Device not found" },
  },
  tags: ["AI"],
});
export type CreateEnergyPredictionRoute = typeof createEnergyPredictionRoute;

// GET /api/v1/devices/{deviceId}/energy-predictions
export const listEnergyPredictionsRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}/energy-predictions",
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: LimitQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(EnergyPredictionDTO) }),
        },
      },
      description: "List energy predictions for a device.",
    },
  },
  tags: ["AI"],
});
export type ListEnergyPredictionsRoute = typeof listEnergyPredictionsRoute;

// POST /api/v1/predictions/{predictionId}/anomalies
export const createAnomalyRoute = createRoute({
  method: "post",
  path: "/api/v1/predictions/{predictionId}/anomalies",
  request: {
    params: z.object({ predictionId: PredictionId }),
    body: { content: { "application/json": { schema: AnomalyCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: AnomalyDTO }) },
      },
      description: "Create anomaly result for a prediction.",
    },
    404: { description: "Prediction not found" },
  },
  tags: ["AI"],
});
export type CreateAnomalyRoute = typeof createAnomalyRoute;

// GET /api/v1/predictions/{predictionId}/anomalies
export const listAnomaliesRoute = createRoute({
  method: "get",
  path: "/api/v1/predictions/{predictionId}/anomalies",
  request: {
    params: z.object({ predictionId: PredictionId }),
    query: LimitQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(AnomalyDTO) }) },
      },
      description: "List anomaly results for a prediction.",
    },
  },
  tags: ["AI"],
});
export type ListAnomaliesRoute = typeof listAnomaliesRoute;
