import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  listHomes,
  createHome,
  getHomeById,
  updateHome,
  deleteHome,
  restoreHome,
} from "../../../services/homes/homes.service";

import type {
  ListHomesRoute,
  CreateHomeRoute,
  GetHomeRoute,
  UpdateHomeRoute,
  DeleteHomeRoute,
  RestoreHomeRoute,
} from "./openapi";

function toHomeDTO(h: {
  id: number;
  name: string;
  ownerUserId: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: h.id,
    name: h.name,
    ownerUserId: h.ownerUserId,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

export const handleListHomes: RouteHandler<ListHomesRoute, AppEnv> = async (
  c,
) => {
  const { ownerId, ownerEmail } = c.req.valid("query");
  const res = await listHomes({ ownerId, ownerEmail });
  return c.json({ data: res.homes.map(toHomeDTO) }, 200);
};

export const handleCreateHome: RouteHandler<CreateHomeRoute, AppEnv> = async (
  c,
) => {
  const body = c.req.valid("json");
  const res = await createHome(body);

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.json({ data: toHomeDTO(res.home) }, 201);
};

export const handleGetHome: RouteHandler<GetHomeRoute, AppEnv> = async (c) => {
  const { homeId } = c.req.valid("param");
  const res = await getHomeById(homeId);

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.json({ data: toHomeDTO(res.home) }, 200);
};

export const handleUpdateHome: RouteHandler<UpdateHomeRoute, AppEnv> = async (
  c,
) => {
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await updateHome(homeId, body);
  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json({ data: toHomeDTO(res.home) }, 200);
};

export const handleDeleteHome: RouteHandler<DeleteHomeRoute, AppEnv> = async (
  c,
) => {
  const { homeId } = c.req.valid("param");
  const res = await deleteHome(homeId);

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.body(null, 204);
};

export const handleRestoreHome: RouteHandler<RestoreHomeRoute, AppEnv> = async (
  c,
) => {
  const { homeId } = c.req.valid("param");
  const res = await restoreHome(homeId);

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.json({ data: toHomeDTO(res.home) }, 200);
};
