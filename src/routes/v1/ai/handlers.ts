import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import type {
  CreateEnergyPredictionRoute,
  ListEnergyPredictionsRoute,
  CreateAnomalyRoute,
  ListAnomaliesRoute,
} from "./openapi";

import {
  createPrediction,
  listPredictions,
  createAnomaly,
  listAnomalies,
  mapPredictionDTO,
  mapAnomalyDTO,
} from "../../../services/ai/ai.service";

export const handleCreateEnergyPrediction: RouteHandler<
  CreateEnergyPredictionRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await createPrediction(Number(deviceId), body);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: mapPredictionDTO(res.p) }, 201);
};

export const handleListEnergyPredictions: RouteHandler<
  ListEnergyPredictionsRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const { limit } = c.req.valid("query");

  const rows = await listPredictions(Number(deviceId), limit);
  return c.json({ data: rows.map(mapPredictionDTO) }, 200);
};

export const handleCreateAnomaly: RouteHandler<
  CreateAnomalyRoute,
  AppEnv
> = async (c) => {
  const { predictionId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await createAnomaly(Number(predictionId), body);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: mapAnomalyDTO(res.row) }, 201);
};

export const handleListAnomalies: RouteHandler<
  ListAnomaliesRoute,
  AppEnv
> = async (c) => {
  const { predictionId } = c.req.valid("param");
  const { limit } = c.req.valid("query");

  const rows = await listAnomalies(Number(predictionId), limit);
  return c.json({ data: rows.map(mapAnomalyDTO) }, 200);
};
