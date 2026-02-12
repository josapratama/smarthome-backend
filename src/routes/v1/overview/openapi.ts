import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  AttentionResponse,
  DashboardResponse,
  ErrorResponse,
  HomeOverviewParams,
  HomeOverviewResponse,
} from "./schemas";

export const dashboardRoute = createRoute({
  method: "get",
  path: "/api/v1/dashboard",
  responses: {
    200: {
      content: { "application/json": { schema: DashboardResponse } },
      description: "User dashboard overview across homes.",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized",
    },
  },
  tags: ["Overview"],
});
export type DashboardRoute = typeof dashboardRoute;

export const homeOverviewRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/overview",
  request: { params: HomeOverviewParams },
  responses: {
    200: {
      content: { "application/json": { schema: HomeOverviewResponse } },
      description: "Home overview dashboard.",
    },
    403: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Forbidden",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Home not found",
    },
  },
  tags: ["Overview"],
});
export type HomeOverviewRoute = typeof homeOverviewRoute;

export const homeAttentionRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/overview/attention",
  request: {
    params: HomeOverviewParams,
    query: z.object({
      offlineMinutes: z.coerce
        .number()
        .int()
        .min(1)
        .max(24 * 60)
        .optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: AttentionResponse } },
      description: "Action items for a home.",
    },
    403: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Forbidden",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Home not found",
    },
  },
  tags: ["Overview"],
});
export type HomeAttentionRoute = typeof homeAttentionRoute;
