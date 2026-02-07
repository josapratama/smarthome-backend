import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { DeviceId, PredictionId } from "../common/ids";
import {
  EnergyPredictionCreateBody,
  EnergyPredictionDTO,
  AnomalyCreateBody,
  AnomalyDTO,
  LimitQuery200,
} from "./schemas";
import {
  createPrediction,
  listPredictions,
  createAnomaly,
  listAnomalies,
  mapPredictionDTO,
  mapAnomalyDTO,
} from "./handlers";

export function registerAiRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/energy-predictions",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: {
            "application/json": { schema: EnergyPredictionCreateBody },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({ data: EnergyPredictionDTO }),
            },
          },
          description: "Create energy prediction record.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createPrediction(deviceId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapPredictionDTO(res.p) }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/energy-predictions",
      request: {
        params: z.object({ deviceId: DeviceId }),
        query: LimitQuery200,
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
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const { limit } = c.req.valid("query");
      const rows = await listPredictions(deviceId, limit);
      return c.json({ data: rows.map(mapPredictionDTO) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/predictions/{predictionId}/anomalies",
      request: {
        params: z.object({ predictionId: PredictionId }),
        body: {
          content: { "application/json": { schema: AnomalyCreateBody } },
        },
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
    }),
    async (c) => {
      const { predictionId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createAnomaly(predictionId, body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      return c.json({ data: mapAnomalyDTO(res.row) }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/predictions/{predictionId}/anomalies",
      request: {
        params: z.object({ predictionId: PredictionId }),
        query: LimitQuery200,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(AnomalyDTO) }),
            },
          },
          description: "List anomaly results for a prediction.",
        },
      },
    }),
    async (c) => {
      const { predictionId } = c.req.valid("param");
      const { limit } = c.req.valid("query");
      const rows = await listAnomalies(predictionId, limit);
      return c.json({ data: rows.map(mapAnomalyDTO) });
    },
  );
}
