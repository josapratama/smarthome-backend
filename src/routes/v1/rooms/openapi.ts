import { createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { RoomCreateBody, RoomDTO, RoomUpdateBody } from "./schemas";
import { DeviceDTO } from "../devices/schemas";

const RoomIdParam = z.object({ roomId: z.coerce.number().int().positive() });

export const listRoomsByHomeRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/rooms",
  summary: "List home rooms",
  description:
    "Retrieve all rooms in a specific home including room details and device counts. Only returns active (non-deleted) rooms.",
  request: { params: z.object({ homeId: HomeId }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(RoomDTO) }) },
      },
      description: "Rooms retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this home" },
    404: { description: "Home not found" },
  },
  tags: ["Room Management"],
});

export const createRoomUnderHomeRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/rooms",
  summary: "Create room in home",
  description:
    "Add a new room to a specific home. Rooms are used to organize and group devices within a home for better management and control.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: RoomCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Room created successfully",
    },
    400: { description: "Bad request - invalid room data" },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this home" },
    404: { description: "Home not found" },
  },
  tags: ["Room Management"],
});

export const getRoomRoute = createRoute({
  method: "get",
  path: "/api/v1/rooms/{roomId}",
  summary: "Get room details",
  description:
    "Retrieve detailed information about a specific room including its devices, configuration, and associated home information.",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Room details retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this room" },
    404: { description: "Room not found" },
  },
  tags: ["Room Management"],
});

export const updateRoomRoute = createRoute({
  method: "patch",
  path: "/api/v1/rooms/{roomId}",
  summary: "Update room information",
  description:
    "Update room properties such as name or configuration. Supports partial updates to modify only specific fields.",
  request: {
    params: RoomIdParam,
    body: { content: { "application/json": { schema: RoomUpdateBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Room updated successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this room" },
    404: { description: "Room not found" },
  },
  tags: ["Room Management"],
});

export const deleteRoomRoute = createRoute({
  method: "delete",
  path: "/api/v1/rooms/{roomId}",
  summary: "Delete room",
  description:
    "Soft delete a room. The room will be marked as deleted but can be restored later. All devices in the room will be unassigned.",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.object({ ok: z.boolean() }) }),
        },
      },
      description: "Room deleted successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this room" },
    404: { description: "Room not found" },
  },
  tags: ["Room Management"],
});

export const restoreRoomRoute = createRoute({
  method: "post",
  path: "/api/v1/rooms/{roomId}/restore",
  summary: "Restore deleted room",
  description:
    "Restore a previously soft-deleted room. The room will become active again and can be used to organize devices.",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: RoomDTO }) } },
      description: "Room restored successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this room" },
    404: { description: "Room not found" },
  },
  tags: ["Room Management"],
});

export const listDevicesByRoomRoute = createRoute({
  method: "get",
  path: "/api/v1/rooms/{roomId}/devices",
  summary: "List room devices",
  description:
    "Retrieve all devices assigned to a specific room including their current status, configuration, and recent activity.",
  request: { params: RoomIdParam },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(DeviceDTO) }) },
      },
      description: "Room devices retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - insufficient permissions for this room" },
    404: { description: "Room not found" },
  },
  tags: ["Room Management"],
});
