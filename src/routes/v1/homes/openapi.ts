import { createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import {
  HomeCreateBody,
  HomeDTO,
  HomesListQuery,
  HomesListResponse,
  HomeUpdateBody,
  TransferOwnershipBody,
} from "./schemas";

export const listHomesRoute = createRoute({
  method: "get",
  path: "/api/v1/homes",
  summary: "List user homes",
  description:
    "Retrieve a list of homes accessible to the current user with optional cursor-based pagination. Returns only active (non-deleted) homes.",
  request: { query: HomesListQuery },
  responses: {
    200: {
      content: {
        "application/json": { schema: HomesListResponse },
      },
      description: "Homes retrieved successfully",
    },
  },
  tags: ["Home Management"],
});

export const createHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes",
  summary: "Create new home",
  description:
    "Create a new home with the current user as the owner. The home can include address information and geographical coordinates.",
  request: {
    body: { content: { "application/json": { schema: HomeCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Home created successfully",
    },
    404: { description: "Owner user not found" },
  },
  tags: ["Home Management"],
});

export const getHomeRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}",
  summary: "Get home details",
  description:
    "Retrieve detailed information about a specific home including its address, members, and associated devices/rooms.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Home details retrieved successfully",
    },
    404: { description: "Home not found" },
  },
  tags: ["Home Management"],
});

export const updateHomeRoute = createRoute({
  method: "patch",
  path: "/api/v1/homes/{homeId}",
  summary: "Update home information",
  description:
    "Update home properties such as name, address, or geographical coordinates. Supports partial updates.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: HomeUpdateBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Home updated successfully",
    },
    404: { description: "Home not found or owner not found" },
  },
  tags: ["Home Management"],
});

export const deleteHomeRoute = createRoute({
  method: "delete",
  path: "/api/v1/homes/{homeId}",
  summary: "Delete home",
  description:
    "Soft delete a home. The home will be marked as deleted but can be restored later. All associated devices and rooms will also be soft deleted.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    204: { description: "Home deleted successfully" },
    404: { description: "Home not found" },
  },
  tags: ["Home Management"],
});

export const restoreHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/restore",
  summary: "Restore deleted home",
  description:
    "Restore a previously soft-deleted home and all its associated devices and rooms.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Home restored successfully",
    },
    404: { description: "Home not found" },
  },
  tags: ["Home Management"],
});

export const transferOwnershipRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/transfer-ownership",
  summary: "Transfer home ownership",
  description:
    "Transfer ownership of a home to another user. Only the current owner or admin can perform this action.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: {
      content: { "application/json": { schema: TransferOwnershipBody } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Ownership transferred successfully",
    },
    403: { description: "Forbidden - insufficient permissions" },
    404: { description: "Home or target user not found" },
  },
  tags: ["Home Management"],
});

export const listNearbyHomesRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/nearby",
  summary: "Find nearby homes (Admin only)",
  description:
    "Search for homes within a specified radius of given coordinates. This endpoint is restricted to admin users for privacy and security reasons.",
  request: {
    query: z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radiusKm: z.coerce.number().min(0.1).max(100).default(5),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(HomeDTO),
          }),
        },
      },
      description: "Nearby homes retrieved successfully",
    },
    403: { description: "Forbidden - admin privileges required" },
  },
  tags: ["Admin"],
});

export type ListNearbyHomesRoute = typeof listNearbyHomesRoute;
export type TransferOwnershipRoute = typeof transferOwnershipRoute;
export type ListHomesRoute = typeof listHomesRoute;
export type CreateHomeRoute = typeof createHomeRoute;
export type GetHomeRoute = typeof getHomeRoute;
export type UpdateHomeRoute = typeof updateHomeRoute;
export type DeleteHomeRoute = typeof deleteHomeRoute;
export type RestoreHomeRoute = typeof restoreHomeRoute;
