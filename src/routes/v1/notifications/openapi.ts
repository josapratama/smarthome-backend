import { createRoute, z } from "@hono/zod-openapi";
import {
  NotificationEndpointCreateBody,
  NotificationEndpointCreateResponse,
  NotificationEndpointListResponse,
  ErrorResponse,
} from "./schemas";

/**
 * Safer endpoints: scope ke user login (/me)
 */
export const listMyNotificationEndpointsRoute = createRoute({
  method: "get",
  path: "/api/v1/me/notification-endpoints",
  responses: {
    200: {
      content: {
        "application/json": { schema: NotificationEndpointListResponse },
      },
      description: "List my notification endpoints (exclude deleted).",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized",
    },
  },
  tags: ["Notifications"],
});
export type ListMyNotificationEndpointsRoute =
  typeof listMyNotificationEndpointsRoute;

export const createMyNotificationEndpointRoute = createRoute({
  method: "post",
  path: "/api/v1/me/notification-endpoints",
  request: {
    body: {
      content: {
        "application/json": { schema: NotificationEndpointCreateBody },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: NotificationEndpointCreateResponse },
      },
      description: "Create my notification endpoint.",
    },
    409: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Endpoint value already exists (active).",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "User not found/disabled",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized",
    },
  },
  tags: ["Notifications"],
});
export type CreateMyNotificationEndpointRoute =
  typeof createMyNotificationEndpointRoute;

/**
 * Optional: soft delete endpoint (recommended karena schema punya deletedAt)
 */
export const deleteMyNotificationEndpointRoute = createRoute({
  method: "delete",
  path: "/api/v1/me/notification-endpoints/{endpointId}",
  request: {
    params: z.object({ endpointId: z.coerce.number().int().positive() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.object({ ok: z.boolean() }) }),
        },
      },
      description: "Soft delete an endpoint.",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized",
    },
  },
  tags: ["Notifications"],
});
export type DeleteMyNotificationEndpointRoute =
  typeof deleteMyNotificationEndpointRoute;
