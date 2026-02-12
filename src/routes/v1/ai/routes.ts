import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  createEnergyPredictionRoute,
  listEnergyPredictionsRoute,
  createAnomalyRoute,
  listAnomaliesRoute,
} from "./openapi";

import {
  handleCreateEnergyPrediction,
  handleListEnergyPredictions,
  handleCreateAnomaly,
  handleListAnomalies,
} from "./handlers";
import { requireAuth } from "../../../middlewares/auth";

export function registerAiRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("/*", requireAuth);

  r.openapi(createEnergyPredictionRoute, handleCreateEnergyPrediction);
  r.openapi(listEnergyPredictionsRoute, handleListEnergyPredictions);

  r.openapi(createAnomalyRoute, handleCreateAnomaly);
  r.openapi(listAnomaliesRoute, handleListAnomalies);

  app.route("/", r);
}
