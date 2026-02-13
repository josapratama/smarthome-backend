import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  EnergyPredictionService,
  AnomalyDetectionService,
  AIOrchestrationService,
} from "../../../services/ai/ai.service";
import { DeviceId, PredictionId } from "../common/ids";
import { requireAuth } from "../../../middlewares/auth";
import type { AppEnv } from "../../../types/app-env";

const ai = new OpenAPIHono<AppEnv>();

// ===== HELPER FUNCTIONS =====

function mapPredictionToDTO(prediction: any) {
  return {
    id: prediction.id,
    deviceId: prediction.deviceId,
    predictedEnergy: prediction.predictedEnergy,
    actualEnergy: prediction.actualEnergy,
    windowStart: prediction.windowStart?.toISOString() || "",
    windowEnd: prediction.windowEnd?.toISOString() || "",
    modelVersion: prediction.modelVersion,
    createdAt: prediction.createdAt.toISOString(),
  };
}

function mapAnomalyToDTO(anomaly: any) {
  return {
    id: anomaly.id,
    predictionId: anomaly.predictionId,
    isAnomaly: anomaly.isAnomaly,
    score: anomaly.score,
    metric: anomaly.metric as "POWER" | "GAS" | "FLAME" | "TRASH",
    details: anomaly.details as Record<string, any>,
    detectedAt: anomaly.detectedAt.toISOString(),
  };
}

// ===== SCHEMAS =====

const EnergyPredictionCreateBody = z
  .object({
    windowStart: z.string(),
    windowEnd: z.string(),
    modelVersion: z.string().optional(),
  })
  .openapi("EnergyPredictionCreateBody");

const EnergyPredictionDTO = z
  .object({
    id: PredictionId,
    deviceId: DeviceId,
    predictedEnergy: z.number(),
    actualEnergy: z.number().nullable(),
    windowStart: z.string(),
    windowEnd: z.string(),
    modelVersion: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("EnergyPredictionDTO");

const AnomalyResultDTO = z
  .object({
    id: z.number(),
    predictionId: PredictionId,
    isAnomaly: z.boolean(),
    score: z.number(),
    metric: z.enum(["POWER", "GAS", "FLAME", "TRASH"]),
    details: z.record(z.string(), z.any()),
    detectedAt: z.string(),
  })
  .openapi("AnomalyResultDTO");

const DeviceInsightsDTO = z
  .object({
    predictions: z.array(EnergyPredictionDTO),
    anomalySummary: z.object({
      totalAnomalies: z.number(),
      byMetric: z.record(z.string(), z.number()),
      avgScore: z.number(),
      criticalCount: z.number(),
    }),
    modelAccuracy: z.number(),
    insights: z.object({
      totalPredictions: z.number(),
      avgPredictedEnergy: z.number(),
      anomalyRate: z.number(),
    }),
  })
  .openapi("DeviceInsightsDTO");

const AnomalyDetectionBody = z
  .object({
    sensorData: z.object({
      current: z.number(),
      gasPpm: z.number(),
      flame: z.boolean(),
      binLevel: z.number(),
      powerW: z.number().optional(),
      energyKwh: z.number().optional(),
      voltageV: z.number().optional(),
      currentA: z.number().optional(),
      frequencyHz: z.number().optional(),
      powerFactor: z.number().optional(),
      distanceCm: z.number().optional(),
    }),
    historicalWindow: z.number().int().min(1).max(168).default(24),
  })
  .openapi("AnomalyDetectionBody");

const PredictionUpdateBody = z
  .object({
    actualEnergy: z.number().min(0),
  })
  .openapi("PredictionUpdateBody");

// ===== ROUTES =====

// Create energy prediction
const createPredictionRoute = createRoute({
  method: "post",
  path: "/devices/{deviceId}/energy-predictions",
  middleware: [requireAuth],
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: {
      content: { "application/json": { schema: EnergyPredictionCreateBody } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ prediction: EnergyPredictionDTO }),
        },
      },
      description: "Energy prediction created successfully",
    },
    400: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Invalid request or insufficient data",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Device not found",
    },
  },
  tags: ["AI"],
});

ai.openapi(createPredictionRoute, async (c) => {
  const { deviceId } = c.req.valid("param");
  const body = c.req.valid("json");

  const result = await EnergyPredictionService.generatePrediction({
    deviceId: Number(deviceId),
    windowStart: new Date(body.windowStart),
    windowEnd: new Date(body.windowEnd),
    modelVersion: body.modelVersion,
  });

  if (result.error) {
    return c.json(
      { error: result.error },
      result.error === "DEVICE_NOT_FOUND" ? 404 : 400,
    );
  }

  return c.json({ prediction: mapPredictionToDTO(result.prediction) }, 201);
});

// Get device energy predictions
const getPredictionsRoute = createRoute({
  method: "get",
  path: "/devices/{deviceId}/energy-predictions",
  middleware: [requireAuth],
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ predictions: z.array(EnergyPredictionDTO) }),
        },
      },
      description: "Energy predictions retrieved successfully",
    },
  },
  tags: ["AI"],
});

ai.openapi(getPredictionsRoute, async (c) => {
  const { deviceId } = c.req.valid("param");
  const { from, to, limit } = c.req.valid("query");

  const predictions = await EnergyPredictionService.getPredictions({
    deviceId: Number(deviceId),
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit,
  });

  return c.json({
    predictions: predictions.map(mapPredictionToDTO),
  });
});

// Update prediction with actual energy
const updatePredictionRoute = createRoute({
  method: "patch",
  path: "/predictions/{predictionId}",
  middleware: [requireAuth],
  request: {
    params: z.object({ predictionId: PredictionId }),
    body: { content: { "application/json": { schema: PredictionUpdateBody } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            prediction: EnergyPredictionDTO,
            accuracy: z.number(),
          }),
        },
      },
      description: "Prediction updated successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Prediction not found",
    },
  },
  tags: ["AI"],
});

ai.openapi(updatePredictionRoute, async (c) => {
  const { predictionId } = c.req.valid("param");
  const { actualEnergy } = c.req.valid("json");

  const result = await EnergyPredictionService.updateWithActual(
    Number(predictionId),
    actualEnergy,
  );

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(
    {
      prediction: mapPredictionToDTO(result.prediction),
      accuracy: result.accuracy,
    },
    200,
  );
});

// Detect anomalies
const detectAnomaliesRoute = createRoute({
  method: "post",
  path: "/predictions/{predictionId}/anomalies",
  middleware: [requireAuth],
  request: {
    params: z.object({ predictionId: PredictionId }),
    body: { content: { "application/json": { schema: AnomalyDetectionBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ anomalies: z.array(AnomalyResultDTO) }),
        },
      },
      description: "Anomaly detection completed",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Prediction not found",
    },
  },
  tags: ["AI"],
});

ai.openapi(detectAnomaliesRoute, async (c) => {
  const { predictionId } = c.req.valid("param");
  const body = c.req.valid("json");

  const result = await AnomalyDetectionService.detectAnomalies({
    predictionId: Number(predictionId),
    sensorData: body.sensorData,
    historicalWindow: body.historicalWindow,
  });

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(
    {
      anomalies: result.anomalies.map(mapAnomalyToDTO),
    },
    201,
  );
});

// Get anomalies for prediction
const getAnomaliesRoute = createRoute({
  method: "get",
  path: "/predictions/{predictionId}/anomalies",
  middleware: [requireAuth],
  request: {
    params: z.object({ predictionId: PredictionId }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ anomalies: z.array(AnomalyResultDTO) }),
        },
      },
      description: "Anomalies retrieved successfully",
    },
  },
  tags: ["AI"],
});

ai.openapi(getAnomaliesRoute, async (c) => {
  const { predictionId } = c.req.valid("param");

  const anomalies = await AnomalyDetectionService.getAnomalies(
    Number(predictionId),
  );

  return c.json({
    anomalies: anomalies.map(mapAnomalyToDTO),
  });
});

// Get device AI insights
const getDeviceInsightsRoute = createRoute({
  method: "get",
  path: "/devices/{deviceId}/ai-insights",
  middleware: [requireAuth],
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: z.object({
      days: z.coerce.number().int().min(1).max(30).default(7),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeviceInsightsDTO } },
      description: "Device AI insights retrieved successfully",
    },
  },
  tags: ["AI"],
});

ai.openapi(getDeviceInsightsRoute, async (c) => {
  const { deviceId } = c.req.valid("param");
  const { days } = c.req.valid("query");

  const insights = await AIOrchestrationService.getDeviceInsights(
    Number(deviceId),
    days,
  );

  return c.json({
    ...insights,
    predictions: insights.predictions.map(mapPredictionToDTO),
  });
});

// Process telemetry through AI pipeline (internal endpoint)
const processTelemetryAIRoute = createRoute({
  method: "post",
  path: "/devices/{deviceId}/process-telemetry",
  middleware: [requireAuth],
  request: {
    params: z.object({ deviceId: DeviceId }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sensorData: z.object({
              current: z.number(),
              gasPpm: z.number(),
              flame: z.boolean(),
              binLevel: z.number(),
              powerW: z.number().optional(),
              energyKwh: z.number().optional(),
              voltageV: z.number().optional(),
              currentA: z.number().optional(),
              frequencyHz: z.number().optional(),
              powerFactor: z.number().optional(),
              distanceCm: z.number().optional(),
            }),
            timestamp: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            prediction: EnergyPredictionDTO,
            anomalies: z.array(AnomalyResultDTO),
          }),
        },
      },
      description: "Telemetry processed through AI pipeline",
    },
    400: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "AI processing failed",
    },
  },
  tags: ["AI"],
});

ai.openapi(processTelemetryAIRoute, async (c) => {
  const { deviceId } = c.req.valid("param");
  const { sensorData, timestamp } = c.req.valid("json");

  const result = await AIOrchestrationService.processTelemetryAI({
    deviceId: Number(deviceId),
    sensorData,
    timestamp: timestamp ? new Date(timestamp) : undefined,
  });

  if (result.error) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(
    {
      prediction: mapPredictionToDTO(result.prediction),
      anomalies: result.anomalies.map(mapAnomalyToDTO),
    },
    200,
  );
});

export function registerAiRoutes(app: OpenAPIHono<AppEnv>) {
  app.route("/api/v1", ai);
}

export { ai };
