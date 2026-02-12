import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  listRoomsByHome,
  createRoomUnderHome,
  getRoomById,
  updateRoom,
  deleteRoom,
  restoreRoom,
  listDevicesByRoom,
} from "../../../services/rooms/room.service";

import { mapDeviceDTO } from "../../../services/devices/device.service";

import type {
  ListRoomsByHomeRoute,
  CreateRoomUnderHomeRoute,
  GetRoomRoute,
  UpdateRoomRoute,
  DeleteRoomRoute,
  RestoreRoomRoute,
  ListDevicesByRoomRoute,
} from "./openapi";

export const handleListRoomsByHome: RouteHandler<
  ListRoomsByHomeRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { homeId } = c.req.valid("param");

  const res = await listRoomsByHome({ requesterUserId: a.user.id, homeId });
  if ("error" in res)
    return c.json(
      { error: res.error },
      res.error === "HOME_NOT_FOUND" ? 404 : 403,
    );

  return c.json({ data: res.data }, 200);
};

export const handleCreateRoomUnderHome: RouteHandler<
  CreateRoomUnderHomeRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await createRoomUnderHome({
    requesterUserId: a.user.id,
    homeId,
    name: body.name,
  });
  if ("error" in res)
    return c.json(
      { error: res.error },
      res.error === "HOME_NOT_FOUND" ? 404 : 403,
    );

  return c.json({ data: res.room }, 201);
};

export const handleGetRoom: RouteHandler<GetRoomRoute, AppEnv> = async (c) => {
  const a = c.get("auth");
  const { roomId } = c.req.valid("param");

  const res = await getRoomById({ requesterUserId: a.user.id, roomId });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.room }, 200);
};

export const handleUpdateRoom: RouteHandler<UpdateRoomRoute, AppEnv> = async (
  c,
) => {
  const a = c.get("auth");
  const { roomId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await updateRoom({
    requesterUserId: a.user.id,
    roomId,
    name: body.name,
  });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.room }, 200);
};

export const handleDeleteRoom: RouteHandler<DeleteRoomRoute, AppEnv> = async (
  c,
) => {
  const a = c.get("auth");
  const { roomId } = c.req.valid("param");

  const res = await deleteRoom({ requesterUserId: a.user.id, roomId });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: { ok: true } }, 200);
};

export const handleRestoreRoom: RouteHandler<RestoreRoomRoute, AppEnv> = async (
  c,
) => {
  const a = c.get("auth");
  const { roomId } = c.req.valid("param");

  const res = await restoreRoom({ requesterUserId: a.user.id, roomId });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.room }, 200);
};

export const handleListDevicesByRoom: RouteHandler<
  ListDevicesByRoomRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { roomId } = c.req.valid("param");

  const res = await listDevicesByRoom({ requesterUserId: a.user.id, roomId });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.data.map(mapDeviceDTO) }, 200);
};
