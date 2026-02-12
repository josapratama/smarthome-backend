import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  getDeviceConfig,
  upsertDeviceConfig,
} from "../../../services/device-config/device-config.service";

import type { GetDeviceConfigRoute, UpsertDeviceConfigRoute } from "./openapi";

export const handleGetDeviceConfig: RouteHandler<
  GetDeviceConfigRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { deviceId } = c.req.valid("param");

  const res = await getDeviceConfig({ requesterUserId: a.user.id, deviceId });
  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.data }, 200);
};

export const handleUpsertDeviceConfig: RouteHandler<
  UpsertDeviceConfigRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { deviceId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await upsertDeviceConfig({
    requesterUserId: a.user.id,
    deviceId,
    config: body.config,
  });

  if ("error" in res)
    return c.json({ error: res.error }, res.error === "NOT_FOUND" ? 404 : 403);

  return c.json({ data: res.data }, 200);
};
