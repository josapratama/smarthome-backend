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
  path: "/",
  request: { query: HomesListQuery },
  responses: {
    200: {
      content: {
        "application/json": { schema: HomesListResponse },
      },
      description: "List active homes (scoped; supports cursor pagination).",
    },
  },
});

export const createHomeRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: { content: { "application/json": { schema: HomeCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Create a home for an existing user.",
    },
    404: { description: "Owner not found" },
  },
});

export const getHomeRoute = createRoute({
  method: "get",
  path: "/{homeId}",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Get an active home by ID.",
    },
    404: { description: "Not found" },
  },
});

export const updateHomeRoute = createRoute({
  method: "patch",
  path: "/{homeId}",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: HomeUpdateBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Update an active home (partial).",
    },
    404: { description: "Not found / owner not found" },
  },
});

export const deleteHomeRoute = createRoute({
  method: "delete",
  path: "/{homeId}",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    204: { description: "Soft deleted" },
    404: { description: "Not found" },
  },
});

export const restoreHomeRoute = createRoute({
  method: "post",
  path: "/{homeId}/restore",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Restore a soft-deleted home.",
    },
    404: { description: "Not found" },
  },
});

export const transferOwnershipRoute = createRoute({
  method: "post",
  path: "/{homeId}/transfer-ownership",
  request: {
    params: z.object({ homeId: HomeId }),
    body: {
      content: { "application/json": { schema: TransferOwnershipBody } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: HomeDTO }) } },
      description: "Transfer home ownership to another user (owner/admin).",
    },
    403: { description: "Forbidden" },
    404: { description: "Home/User not found" },
  },
});

export const listNearbyHomesRoute = createRoute({
  method: "get",
  path: "/nearby",
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
      description: "List homes near a coordinate (admin only for now).",
    },
    403: { description: "Forbidden" },
  },
});

export type ListNearbyHomesRoute = typeof listNearbyHomesRoute;
export type TransferOwnershipRoute = typeof transferOwnershipRoute;
export type ListHomesRoute = typeof listHomesRoute;
export type CreateHomeRoute = typeof createHomeRoute;
export type GetHomeRoute = typeof getHomeRoute;
export type UpdateHomeRoute = typeof updateHomeRoute;
export type DeleteHomeRoute = typeof deleteHomeRoute;
export type RestoreHomeRoute = typeof restoreHomeRoute;
