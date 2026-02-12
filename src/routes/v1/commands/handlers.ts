import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { toISO } from "../common/helpers";

import type { CreateCommandRoute, GetCommandRoute } from "./openapi";
import {
  createAndSendCommand,
  getCommandById,
} from "../../../services/command.service";

export function mapCommandDTO(cmd: any) {
  return {
    id: cmd.id,
    deviceId: cmd.deviceId,
    type: cmd.type,
    payload: cmd.payload,
    status: cmd.status,
    ackedAt: toISO(cmd.ackedAt),
    lastError: cmd.lastError ?? null,
    requestedBy: cmd.requestedBy ?? null,
    source: cmd.source,
    correlationId: cmd.correlationId,
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
  };
}

export const handleCreateCommand: RouteHandler<
  CreateCommandRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const body = c.req.valid("json");

  // kalau endpoint sudah pakai requireAuth, ambil user id
  const a = c.get("auth");
  const requestedByUserId = a?.user?.id ?? null;

  const res = await createAndSendCommand({
    deviceId: Number(deviceId),
    type: body.type,
    payload: body.payload,
    requestedByUserId,
    source: body.source ?? "USER",
  });

  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: mapCommandDTO(res.cmd) }, 201);
};

export const handleGetCommand: RouteHandler<GetCommandRoute, AppEnv> = async (
  c,
) => {
  const { commandId } = c.req.valid("param");

  const res = await getCommandById(Number(commandId));
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: mapCommandDTO(res.cmd) }, 200);
};
