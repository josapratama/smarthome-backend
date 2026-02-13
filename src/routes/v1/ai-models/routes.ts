import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { AIModelService } from "../../../services/ai/ai-model.service";
import { DeviceId } from "../common/ids";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";
import type { AppEnv } from "../../../types/app-env";

const aiModels = new OpenAPIHono<AppEnv>();

// ===== SCHEMAS =====

const AIModelCreateBody = z
  .object({
    name: z.string().min(1).max(100),
    version: z.string().min(1).max(50),
    algorithm: z.enum([
      "moving_average",
      "linear_regression",
      "seasonal_decomposition",
    ]),
    parameters: z.record(z.string(), z.any()),
    description: z.string().optional(),
  })
  .openapi("AIModelCreateBody");

const AIModelUpdateBody = z
  .object({
    version: z.string().min(1).max(50).optional(),
    algorithm: z
      .enum(["moving_average", "linear_regression", "seasonal_decomposition"])
      .optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("AIModelUpdateBody");

const AIModelDTO = z
  .object({
    id: z.number(),
    name: z.string(),
    version: z.string(),
    algorithm: z.string(),
    parameters: z.record(z.string(), z.any()),
    isActive: z.boolean(),
    description: z.string().nullable(),
    totalPredictions: z.number(),
    avgAccuracy: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("AIModelDTO");

const AIModelPerformanceDTO = z
  .object({
    id: z.number(),
    modelName: z.string(),
    deviceId: z.number(),
    accuracy: z.number(),
    predictionDate: z.string(),
    recordedAt: z.string(),
    device: z.object({
      id: z.number(),
      deviceName: z.string(),
      deviceType: z.string(),
    }),
  })
  .openapi("AIModelPerformanceDTO");

const ModelComparisonDTO = z
  .object({
    modelName: z.string(),
    totalPredictions: z.number(),
    avgAccuracy: z.number(),
    minAccuracy: z.number(),
    maxAccuracy: z.number(),
  })
  .openapi("ModelComparisonDTO");

// ===== HELPER FUNCTIONS =====

function mapModelToDTO(model: any) {
  return {
    id: model.id,
    name: model.name,
    version: model.version,
    algorithm: model.algorithm,
    parameters: model.parameters as Record<string, any>,
    isActive: model.isActive,
    description: model.description,
    totalPredictions: model.totalPredictions,
    avgAccuracy: model.avgAccuracy,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

function mapPerformanceToDTO(performance: any) {
  return {
    id: performance.id,
    modelName: performance.modelName,
    deviceId: performance.deviceId,
    accuracy: performance.accuracy,
    predictionDate: performance.predictionDate.toISOString(),
    recordedAt: performance.recordedAt.toISOString(),
    device: {
      id: performance.device.id,
      deviceName: performance.device.deviceName,
      deviceType: performance.device.deviceType,
    },
  };
}

// ===== ROUTES =====

// Create AI model
const createModelRoute = createRoute({
  method: "post",
  path: "/ai-models",
  summary: "Create AI model",
  description:
    "Create a new AI model configuration for energy prediction with specified algorithm and parameters. Only admin users can create models.",
  middleware: [requireAdmin],
  request: {
    body: {
      content: { "application/json": { schema: AIModelCreateBody } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ model: AIModelDTO }),
        },
      },
      description: "AI model created successfully",
    },
    400: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Model already exists or invalid configuration",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(createModelRoute, async (c) => {
  const body = c.req.valid("json");

  const result = await AIModelService.createModel(body);

  if (result.error) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ model: mapModelToDTO(result.model) }, 201);
});

// Get all AI models
const getModelsRoute = createRoute({
  method: "get",
  path: "/ai-models",
  summary: "List AI models",
  description:
    "Retrieve all available AI models with optional filtering by active status and algorithm type. Includes performance metrics.",
  middleware: [requireAuth],
  request: {
    query: z.object({
      isActive: z.coerce.boolean().optional(),
      algorithm: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ models: z.array(AIModelDTO) }),
        },
      },
      description: "AI models retrieved successfully",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(getModelsRoute, async (c) => {
  const { isActive, algorithm, limit } = c.req.valid("query");

  const models = await AIModelService.getModels({
    isActive,
    algorithm,
    limit,
  });

  return c.json({
    models: models.map(mapModelToDTO),
  });
});

// Get AI model by name
const getModelRoute = createRoute({
  method: "get",
  path: "/ai-models/{name}",
  summary: "Get AI model details",
  description:
    "Retrieve detailed information about a specific AI model including its configuration, performance metrics, and current status.",
  middleware: [requireAuth],
  request: {
    params: z.object({ name: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ model: AIModelDTO }),
        },
      },
      description: "AI model details retrieved successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "AI model not found",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(getModelRoute, async (c) => {
  const { name } = c.req.valid("param");

  const result = await AIModelService.getModelByName(name);

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json({ model: mapModelToDTO(result.model) }, 200);
});

// Update AI model
const updateModelRoute = createRoute({
  method: "patch",
  path: "/ai-models/{name}",
  summary: "Update AI model configuration",
  description:
    "Update an existing AI model's configuration including version, algorithm parameters, description, or activation status. Only admin users can modify models.",
  middleware: [requireAdmin],
  request: {
    params: z.object({ name: z.string() }),
    body: {
      content: { "application/json": { schema: AIModelUpdateBody } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ model: AIModelDTO }),
        },
      },
      description: "AI model updated successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Model not found",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(updateModelRoute, async (c) => {
  const { name } = c.req.valid("param");
  const body = c.req.valid("json");

  const result = await AIModelService.updateModel(name, body);

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json({ model: mapModelToDTO(result.model) }, 200);
});

// Activate AI model
const activateModelRoute = createRoute({
  method: "post",
  path: "/ai-models/{name}/activate",
  summary: "Activate AI model",
  description:
    "Activate a specific AI model for energy predictions. This will deactivate other models using the same algorithm to ensure only one model per algorithm is active. Only admin users can activate models.",
  middleware: [requireAdmin],
  request: {
    params: z.object({ name: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ model: AIModelDTO }),
        },
      },
      description: "AI model activated successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Model not found",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(activateModelRoute, async (c) => {
  const { name } = c.req.valid("param");

  const result = await AIModelService.activateModel(name);

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json({ model: mapModelToDTO(result.model) }, 200);
});

// Delete AI model
const deleteModelRoute = createRoute({
  method: "delete",
  path: "/ai-models/{name}",
  summary: "Delete AI model",
  description:
    "Permanently delete an AI model from the system. Only inactive models can be deleted to prevent disruption of active predictions. Only admin users can delete models.",
  middleware: [requireAdmin],
  request: {
    params: z.object({ name: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
      description: "AI model deleted successfully",
    },
    400: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Cannot delete active model",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Model not found",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(deleteModelRoute, async (c) => {
  const { name } = c.req.valid("param");

  const result = await AIModelService.deleteModel(name);

  if (result.error) {
    const status = result.error === "MODEL_NOT_FOUND" ? 404 : 400;
    return c.json({ error: result.error }, status);
  }

  return c.json({ success: result.success }, 200);
});

// Get model performance
const getModelPerformanceRoute = createRoute({
  method: "get",
  path: "/ai-models/performance",
  summary: "Get AI model performance metrics",
  description:
    "Retrieve detailed performance metrics for AI models including accuracy scores, prediction counts, and historical performance data. Supports filtering by model name, device, and date range.",
  middleware: [requireAuth],
  request: {
    query: z.object({
      modelName: z.string().optional(),
      deviceId: DeviceId.optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(500).default(100),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ performances: z.array(AIModelPerformanceDTO) }),
        },
      },
      description: "Model performance data retrieved successfully",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(getModelPerformanceRoute, async (c) => {
  const { modelName, deviceId, from, to, limit } = c.req.valid("query");

  const performances = await AIModelService.getModelPerformance({
    modelName,
    deviceId: deviceId ? Number(deviceId) : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit,
  });

  return c.json({
    performances: performances.map(mapPerformanceToDTO),
  });
});

// Compare models
const compareModelsRoute = createRoute({
  method: "get",
  path: "/ai-models/compare",
  summary: "Compare AI model performance",
  description:
    "Compare performance metrics across different AI models to identify the best performing algorithms. Provides statistical analysis including average, minimum, and maximum accuracy scores for model evaluation.",
  middleware: [requireAuth],
  request: {
    query: z.object({
      algorithms: z.string().optional(),
      deviceId: DeviceId.optional(),
      days: z.coerce.number().int().min(1).max(365).default(30),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ comparison: z.array(ModelComparisonDTO) }),
        },
      },
      description: "Model comparison data retrieved successfully",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(compareModelsRoute, async (c) => {
  const { algorithms, deviceId, days } = c.req.valid("query");

  const comparison = await AIModelService.compareModels({
    algorithms: algorithms ? algorithms.split(",") : undefined,
    deviceId: deviceId ? Number(deviceId) : undefined,
    days,
  });

  return c.json({
    comparison: comparison.map((stats: any) => ({
      modelName: stats.modelName,
      totalPredictions: stats.totalPredictions,
      avgAccuracy: stats.avgAccuracy,
      minAccuracy: stats.minAccuracy,
      maxAccuracy: stats.maxAccuracy,
    })),
  });
});

// Get best model for device
const getBestModelRoute = createRoute({
  method: "get",
  path: "/devices/{deviceId}/best-model",
  summary: "Get best performing AI model for device",
  description:
    "Identify the best performing AI model for a specific device based on historical accuracy metrics. Returns the model with highest average accuracy over the specified time period, requiring minimum prediction count for reliability.",
  middleware: [requireAuth],
  request: {
    params: z.object({ deviceId: DeviceId }),
    query: z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            model: AIModelDTO,
            avgAccuracy: z.number(),
            totalPredictions: z.number(),
          }),
        },
      },
      description: "Best model for device retrieved successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "No performance data available",
    },
  },
  tags: ["AI Model Management"],
});

aiModels.openapi(getBestModelRoute, async (c) => {
  const { deviceId } = c.req.valid("param");
  const { days } = c.req.valid("query");

  const result = await AIModelService.getBestModelForDevice(
    Number(deviceId),
    days,
  );

  if (result.error) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(
    {
      model: mapModelToDTO(result.model),
      avgAccuracy: result.avgAccuracy || 0,
      totalPredictions: result.totalPredictions || 0,
    },
    200,
  );
});

export function registerAiModelRoutes(app: OpenAPIHono<AppEnv>) {
  app.route("/api/v1", aiModels);
}

export { aiModels };
