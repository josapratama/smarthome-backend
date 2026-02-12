import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import type {
  ListHomeAlarmsRoute,
  CreateHomeAlarmRoute,
  AckAlarmRoute,
  ResolveAlarmRoute,
} from "./openapi";

import {
  listHomeAlarms,
  createHomeAlarm,
  acknowledgeAlarm,
  resolveAlarm,
  mapAlarmDTO,
} from "../../../services/alarms/alarms.service";

export const handleListHomeAlarms: RouteHandler<
  ListHomeAlarmsRoute,
  AppEnv
> = async (c) => {
  const { homeId } = c.req.valid("param");
  const { from, to, status, limit } = c.req.valid("query");

  const rows = await listHomeAlarms(Number(homeId), {
    from,
    to,
    status: status ?? undefined,
    limit,
  });

  return c.json({ data: rows.map(mapAlarmDTO) }, 200);
};

export const handleCreateHomeAlarm: RouteHandler<
  CreateHomeAlarmRoute,
  AppEnv
> = async (c) => {
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await createHomeAlarm(Number(homeId), body);

  if ("error" in res) {
    const e = res.error;
    const is404 =
      e === "HOME_NOT_FOUND" ||
      e === "DEVICE_NOT_FOUND" ||
      e === "SENSOR_DATA_NOT_FOUND" ||
      e === "SENSOR_READING_NOT_FOUND";
    return c.json({ error: e }, is404 ? 404 : 400);
  }

  return c.json({ data: mapAlarmDTO(res.alarm) }, 201);
};

export const handleAckAlarm: RouteHandler<AckAlarmRoute, AppEnv> = async (
  c,
) => {
  const { homeId, alarmId } = c.req.valid("param");
  const a = c.get("auth");

  const res = await acknowledgeAlarm({
    homeId: Number(homeId),
    alarmId: Number(alarmId),
    userId: a.user.id,
  });

  if ("error" in res) {
    const code = res.error === "NOT_FOUND" ? 404 : 400;
    return c.json({ error: res.error }, code);
  }

  return c.json({ data: mapAlarmDTO(res.alarm) }, 200);
};

export const handleResolveAlarm: RouteHandler<
  ResolveAlarmRoute,
  AppEnv
> = async (c) => {
  const { homeId, alarmId } = c.req.valid("param");
  const a = c.get("auth");

  const res = await resolveAlarm({
    homeId: Number(homeId),
    alarmId: Number(alarmId),
    userId: a.user.id,
  });

  if ("error" in res) {
    const code = res.error === "NOT_FOUND" ? 404 : 400;
    return c.json({ error: res.error }, code);
  }

  return c.json({ data: mapAlarmDTO(res.alarm) }, 200);
};
