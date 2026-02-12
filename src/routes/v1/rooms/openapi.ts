import { createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { RoomCreateBody, RoomDTO, RoomUpdateBody } from "./schemas";
import { DeviceDTO } from "../devices/schemas";

const RoomIdParam = z.object({ roomId: z.coerce.number().int().positive() });

export const listRoomsByHomeRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/rooms",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(RoomDTO) }) },
      },
      description: "List rooms in a home.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Home not found" },
  },
  tags: ["Rooms"],
});
export type ListRoomsByHomeRoute = typeof listRoomsByHomeRoute;

export const createRoomUnderHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/rooms",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: RoomCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Create room under a home.",
    },
    400: { description: "Bad request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Home not found" },
  },
  tags: ["Rooms"],
});
export type CreateRoomUnderHomeRoute = typeof createRoomUnderHomeRoute;

export const getRoomRoute = createRoute({
  method: "get",
  path: "/api/v1/rooms/{roomId}",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Get room detail.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
  tags: ["Rooms"],
});
export type GetRoomRoute = typeof getRoomRoute;

export const updateRoomRoute = createRoute({
  method: "patch",
  path: "/api/v1/rooms/{roomId}",
  request: {
    params: RoomIdParam,
    body: { content: { "application/json": { schema: RoomUpdateBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Update room name.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
  tags: ["Rooms"],
});
export type UpdateRoomRoute = typeof updateRoomRoute;

export const deleteRoomRoute = createRoute({
  method: "delete",
  path: "/api/v1/rooms/{roomId}",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.object({ ok: z.boolean() }) }),
        },
      },
      description: "Soft delete room.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
  tags: ["Rooms"],
});
export type DeleteRoomRoute = typeof deleteRoomRoute;

export const restoreRoomRoute = createRoute({
  method: "post",
  path: "/api/v1/rooms/{roomId}/restore",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Restore soft-deleted room.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
  tags: ["Rooms"],
});
export type RestoreRoomRoute = typeof restoreRoomRoute;

export const listDevicesByRoomRoute = createRoute({
  method: "get",
  path: "/api/v1/rooms/{roomId}/devices",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(DeviceDTO) }) },
      },
      description: "List devices in a room.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Room not found" },
  },
  tags: ["Rooms"],
});
export type ListDevicesByRoomRoute = typeof listDevicesByRoomRoute;
