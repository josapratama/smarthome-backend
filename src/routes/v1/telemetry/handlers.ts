import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireDeviceKey } from "../../../middlewares/device-auth";

import type {
  IngestTelemetryRoute,
  GetLatestTelemetryRoute,
  QueryTelemetryRoute,
} from "./openapi";

import {
  ingestTelemetry as ingestTelemetrySvc,
  getLatestTelemetry,
  queryTelemetry,
} from "../../../services/telemetry/telemetry.service";

export function mapSensorDTO(r: any) {
  return {
    id: r.id,
    deviceId: r.deviceId,
    current: r.current,
    gasPpm: r.gasPpm,
    flame: r.flame,
    binLevel: r.binLevel,
    powerW: r.powerW ?? null,
    energyKwh: r.energyKwh ?? null,
    timestamp: r.timestamp.toISOString(),
  };
}

export const handleIngestTelemetry: RouteHandler<
  IngestTelemetryRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const headers = c.req.valid("header");
  const deviceKey = headers["x-device-key"];

  // device auth (kalau kamu ingin wajib, ubah schema header jadi required)
  const authRes = await requireDeviceKey(
    c,
    async () => {},
    Number(deviceId),
    deviceKey,
  );
  if (authRes) return authRes;

  const body = c.req.valid("json");

  const res = await ingestTelemetrySvc({
    deviceId: Number(deviceId),
    telemetry: body,
    source: "DEVICE",
  });

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.json({ data: mapSensorDTO(res.sensor) }, 201);
};

export const handleGetLatestTelemetry: RouteHandler<
  GetLatestTelemetryRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");

  const row = await getLatestTelemetry(Number(deviceId));
  if (!row) return c.json({ data: null }, 200);

  return c.json({ data: mapSensorDTO(row) }, 200);
};

export const handleQueryTelemetry: RouteHandler<
  QueryTelemetryRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const { from, to, limit } = c.req.valid("query");

  const rows = await queryTelemetry({
    deviceId: Number(deviceId),
    from,
    to,
    limit,
  });
  return c.json({ data: rows.map(mapSensorDTO) }, 200);
};
