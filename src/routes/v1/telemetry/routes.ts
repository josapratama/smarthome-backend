import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  ingestTelemetryRoute,
  getLatestTelemetryRoute,
  queryTelemetryRoute,
} from "./openapi";

import {
  handleIngestTelemetry,
  handleGetLatestTelemetry,
  handleQueryTelemetry,
} from "./handlers";

export function registerTelemetryRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.openapi(ingestTelemetryRoute, handleIngestTelemetry);
  r.openapi(getLatestTelemetryRoute, handleGetLatestTelemetry);
  r.openapi(queryTelemetryRoute, handleQueryTelemetry);

  app.route("/", r);
}
