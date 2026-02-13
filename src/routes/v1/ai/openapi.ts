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
  summary: "Create energy prediction",
  description:
    "Generate AI-powered energy consumption prediction for a device using machine learning algorithms and historical sensor data.",
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
      description: "Energy prediction created successfully",
    },
    404: { description: "Device not found" },
  },
  tags: ["AI & Analytics"],
});

// GET /api/v1/devices/{deviceId}/energy-predictions
export const listEnergyPredictionsRoute = createRoute({
  method: "get",
  path: "/api/v1/devices/{deviceId}/energy-predictions",
  summary: "List device energy predictions",
  description:
    "Retrieve historical energy predictions for a device with accuracy metrics and comparison to actual consumption.",
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
      description: "Energy predictions retrieved successfully",
    },
  },
  tags: ["AI & Analytics"],
});

// POST /api/v1/predictions/{predictionId}/anomalies
export const createAnomalyRoute = createRoute({
  method: "post",
  path: "/api/v1/predictions/{predictionId}/anomalies",
  summary: "Create anomaly detection result",
  description:
    "Record anomaly detection results for a prediction including sensor malfunction, power spikes, gas leaks, and other abnormal patterns.",
  request: {
    params: z.object({ predictionId: PredictionId }),
    body: { content: { "application/json": { schema: AnomalyCreateBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ data: AnomalyDTO }) },
      },
      description: "Anomaly result created successfully",
    },
    404: { description: "Prediction not found" },
  },
  tags: ["AI & Analytics"],
});

// GET /api/v1/predictions/{predictionId}/anomalies
export const listAnomaliesRoute = createRoute({
  method: "get",
  path: "/api/v1/predictions/{predictionId}/anomalies",
  summary: "List prediction anomalies",
  description:
    "Retrieve all anomaly detection results for a specific prediction including severity scores and detection details.",
  request: {
    params: z.object({ predictionId: PredictionId }),
    query: LimitQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(AnomalyDTO) }) },
      },
      description: "Anomaly results retrieved successfully",
    },
  },
  tags: ["AI & Analytics"],
});
