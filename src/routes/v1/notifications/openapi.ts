import { createRoute, z } from "@hono/zod-openapi";
import {
  NotificationEndpointCreateBody,
  NotificationEndpointCreateResponse,
  NotificationEndpointListResponse,
  ErrorResponse,
} from "./schemas";

/**
 * User notification endpoint management
 */
export const listMyNotificationEndpointsRoute = createRoute({
  method: "get",
  path: "/api/v1/me/notification-endpoints",
  summary: "List my notification endpoints",
  description:
    "Retrieve all active notification endpoints for the current user including FCM tokens, email addresses, webhooks, and other delivery channels.",
  responses: {
    200: {
      content: {
        "application/json": { schema: NotificationEndpointListResponse },
      },
      description: "Notification endpoints retrieved successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized - invalid or missing token",
    },
  },
  tags: ["Notification Management"],
});

export const createMyNotificationEndpointRoute = createRoute({
  method: "post",
  path: "/api/v1/me/notification-endpoints",
  summary: "Add notification endpoint",
  description:
    "Register a new notification endpoint for the current user such as FCM token for mobile push notifications, email address, or webhook URL.",
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
      description: "Notification endpoint created successfully",
    },
    409: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Endpoint already exists for this user",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "User account not found or disabled",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized - invalid or missing token",
    },
  },
  tags: ["Notification Management"],
});

/**
 * Remove notification endpoint
 */
export const deleteMyNotificationEndpointRoute = createRoute({
  method: "delete",
  path: "/api/v1/me/notification-endpoints/{endpointId}",
  summary: "Remove notification endpoint",
  description:
    "Soft delete a notification endpoint to stop receiving notifications on that channel. The endpoint can be re-added later if needed.",
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
      description: "Notification endpoint removed successfully",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Notification endpoint not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "Unauthorized - invalid or missing token",
    },
  },
  tags: ["Notification Management"],
});
