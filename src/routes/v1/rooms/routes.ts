import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth } from "../../../middlewares/auth";

import {
  listRoomsByHomeRoute,
  createRoomUnderHomeRoute,
  getRoomRoute,
  updateRoomRoute,
  deleteRoomRoute,
  restoreRoomRoute,
  listDevicesByRoomRoute,
} from "./openapi";

import {
  handleListRoomsByHome,
  handleCreateRoomUnderHome,
  handleGetRoom,
  handleUpdateRoom,
  handleDeleteRoom,
  handleRestoreRoom,
  handleListDevicesByRoom,
} from "./handlers";

export function registerRoomsRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  r.use("/*", requireAuth);

  r.openapi(listRoomsByHomeRoute, handleListRoomsByHome);
  r.openapi(createRoomUnderHomeRoute, handleCreateRoomUnderHome);

  r.openapi(getRoomRoute, handleGetRoom);
  r.openapi(updateRoomRoute, handleUpdateRoom);
  r.openapi(deleteRoomRoute, handleDeleteRoom);
  r.openapi(restoreRoomRoute, handleRestoreRoom);
  r.openapi(listDevicesByRoomRoute, handleListDevicesByRoom);

  app.route("/", r);
}
