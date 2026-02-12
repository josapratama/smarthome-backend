import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";

import {
  listHomes,
  createHome,
  getHomeById,
  updateHome,
  deleteHome,
  restoreHome,
  transferOwnership,
} from "../../../services/homes/homes.service";

import type {
  ListHomesRoute,
  CreateHomeRoute,
  GetHomeRoute,
  UpdateHomeRoute,
  DeleteHomeRoute,
  RestoreHomeRoute,
  TransferOwnershipRoute,
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
    guaranteeOwnerUserId: h.ownerUserId,
    ownerUserId: h.ownerUserId,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

export const handleListHomes: RouteHandler<ListHomesRoute, AppEnv> = async (
  c,
) => {
  const auth = c.get("auth")!.user;
  const { ownerId, ownerEmail, limit, cursor } = c.req.valid("query");

  const res = await listHomes(auth, { ownerId, ownerEmail, limit, cursor });

  return c.json(
    {
      data: res.homes.map(toHomeDTO),
      nextCursor: res.nextCursor,
    },
    200,
  );
};

export const handleCreateHome: RouteHandler<CreateHomeRoute, AppEnv> = async (
  c,
) => {
  const auth = c.get("auth")!.user;
  const body = c.req.valid("json");

  const res = await createHome(auth, body);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    if (res.error === "OWNER_NOT_FOUND")
      return c.json({ error: res.error }, 404);
    return c.json({ error: res.error }, 400);
  }

  return c.json({ data: toHomeDTO(res.home) }, 201);
};

export const handleGetHome: RouteHandler<GetHomeRoute, AppEnv> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await getHomeById(auth, homeId);

  if ("error" in res) return c.json({ error: res.error }, 404);
  return c.json({ data: toHomeDTO(res.home) }, 200);
};

export const handleUpdateHome: RouteHandler<UpdateHomeRoute, AppEnv> = async (
  c,
) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await updateHome(auth, homeId, body);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.json({ data: toHomeDTO(res.home) }, 200);
};

export const handleDeleteHome: RouteHandler<DeleteHomeRoute, AppEnv> = async (
  c,
) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await deleteHome(auth, homeId);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.body(null, 204);
};

export const handleRestoreHome: RouteHandler<RestoreHomeRoute, AppEnv> = async (
  c,
) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");

  const res = await restoreHome(auth, homeId);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.json({ data: toHomeDTO(res.home) }, 200);
};

export const handleTransferOwnership: RouteHandler<
  TransferOwnershipRoute,
  AppEnv
> = async (c) => {
  const auth = c.get("auth")!.user;
  const { homeId } = c.req.valid("param");
  const body = c.req.valid("json");

  const res = await transferOwnership(auth, homeId, body.newOwnerUserId);

  if ("error" in res) {
    if (res.error === "FORBIDDEN") return c.json({ error: "FORBIDDEN" }, 403);
    return c.json({ error: res.error }, 404);
  }

  return c.json({ data: toHomeDTO(res.home) }, 200);
};
