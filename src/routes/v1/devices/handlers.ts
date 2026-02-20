import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  listDevices,
  createDeviceUnderHome,
  getDeviceById,
  patchDevice,
  deleteDevice,
  mapDeviceDTO,
} from "../../../services/devices/device.service";

import type {
  DevicesListRoute,
  DevicesCreateUnderHomeRoute,
  DevicesGetByIdRoute,
  DevicesPatchRoute,
  DevicesDeleteRoute,
} from "./openapi";

export const handleDevicesList: RouteHandler<DevicesListRoute, AppEnv> = async (
  c,
) => {
  const a = c.get("auth");
  const q = c.req.valid("query");

  const devices = await listDevices({
    requesterUserId: a.user.id,
    requesterRole: a.user.role,
    homeId: q.homeId,
    status: q.status,
  });

  if ("error" in devices) return c.json({ error: devices.error }, 403);
  return c.json({ data: devices.data.map(mapDeviceDTO) }, 200);
};

export const handleDevicesCreateUnderHome: RouteHandler<
  DevicesCreateUnderHomeRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await createDeviceUnderHome({
    requesterUserId: a.user.id,
    requesterRole: a.user.role,
    homeId,
    input: body,
  });

  if ("error" in res)
    return c.json(
      { error: res.error },
      res.error === "HOME_NOT_FOUND" ? 404 : 403,
    );
  return c.json({ data: mapDeviceDTO(res.device) }, 201);
};

export const handleDevicesGetById: RouteHandler<
  DevicesGetByIdRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { deviceId } = c.req.valid("param");

  const res = await getDeviceById({
    requesterUserId: a.user.id,
    requesterRole: a.user.role,
    deviceId,
  });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: mapDeviceDTO(res.device) }, 200);
};

export const handleDevicesPatch: RouteHandler<
  DevicesPatchRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { deviceId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await patchDevice({
    requesterUserId: a.user.id,
    requesterRole: a.user.role,
    deviceId,
    body,
  });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: mapDeviceDTO(res.device) }, 200);
};

export const handleDevicesDelete: RouteHandler<
  DevicesDeleteRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { deviceId } = c.req.valid("param");

  const res = await deleteDevice({
    requesterUserId: a.user.id,
    requesterRole: a.user.role,
    deviceId,
  });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ message: "Device deleted successfully" }, 200);
};
