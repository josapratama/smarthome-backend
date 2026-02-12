import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { prisma } from "../../../lib/prisma";
import type {
  ListMyNotificationEndpointsRoute,
  CreateMyNotificationEndpointRoute,
  DeleteMyNotificationEndpointRoute,
} from "./openapi";

export function mapEndpointDTO(r: any) {
  return {
    id: r.id,
    userId: r.userId,
    channel: r.channel,
    value: r.value,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listEndpointsByUser(userId: number) {
  return prisma.notificationEndpoint.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEndpointForUser(
  userId: number,
  body: { channel: any; value: string },
) {
  // user must exist and active (optional guard)
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || !user.isActive) {
    return { error: "USER_NOT_FOUND" as const };
  }

  // Prisma schema: "value seharusnya unik untuk endpoint aktif saja" => partial unique index di SQL migration
  // Tapi untuk safety, kita guard manual di app-level agar konsisten.
  const exists = await prisma.notificationEndpoint.findFirst({
    where: { value: body.value, deletedAt: null },
    select: { id: true },
  });
  if (exists) return { error: "ALREADY_EXISTS" as const };

  const row = await prisma.notificationEndpoint.create({
    data: { userId, channel: body.channel, value: body.value },
  });

  return { row };
}

export async function softDeleteEndpoint(userId: number, endpointId: number) {
  const res = await prisma.notificationEndpoint.updateMany({
    where: { id: endpointId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (res.count === 0) return { error: "NOT_FOUND" as const };
  return { ok: true as const };
}

export const handleListMyNotificationEndpoints: RouteHandler<
  ListMyNotificationEndpointsRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const rows = await listEndpointsByUser(a.user.id);
  return c.json({ data: rows.map(mapEndpointDTO) }, 200);
};

export const handleCreateMyNotificationEndpoint: RouteHandler<
  CreateMyNotificationEndpointRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const body = c.req.valid("json");

  const res = await createEndpointForUser(a.user.id, body);

  if ("error" in res) {
    if (res.error === "ALREADY_EXISTS") {
      return c.json({ error: "ALREADY_EXISTS" }, 409);
    }
    // USER_NOT_FOUND / disabled
    return c.json({ error: "USER_NOT_FOUND" }, 404);
  }

  return c.json({ data: mapEndpointDTO(res.row) }, 201);
};

export const handleDeleteMyNotificationEndpoint: RouteHandler<
  DeleteMyNotificationEndpointRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const { endpointId } = c.req.valid("param");

  const res = await softDeleteEndpoint(a.user.id, Number(endpointId));
  if ("error" in res) {
    return c.json({ error: "NOT_FOUND" }, 404);
  }

  return c.json({ data: { ok: true } }, 200);
};
