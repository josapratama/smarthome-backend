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
  summary: "Get user dashboard overview",
  description:
    "Retrieve comprehensive dashboard data including statistics across all user's homes, devices, recent activities, and system status.",
  responses: {
    200: {
      content: { "application/json": { schema: DashboardResponse } },
      description: "Dashboard data retrieved successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized - invalid or missing token",
    },
  },
  tags: ["Dashboard & Analytics"],
});

export const homeOverviewRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/overview",
  summary: "Get home overview dashboard",
  description:
    "Retrieve detailed overview for a specific home including device status, room statistics, energy consumption, and recent alerts.",
  request: { params: HomeOverviewParams },
  responses: {
    200: {
      content: { "application/json": { schema: HomeOverviewResponse } },
      description: "Home overview data retrieved successfully",
    },
    403: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Forbidden - insufficient permissions for this home",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Home not found",
    },
  },
  tags: ["Dashboard & Analytics"],
});

export const homeAttentionRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/overview/attention",
  summary: "Get home attention items",
  description:
    "Retrieve items requiring user attention such as offline devices, pending alarms, failed commands, and maintenance notifications for a specific home.",
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
      description: "Attention items retrieved successfully",
    },
    403: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Forbidden - insufficient permissions for this home",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Home not found",
    },
  },
  tags: ["Dashboard & Analytics"],
});
