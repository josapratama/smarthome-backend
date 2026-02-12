import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import type { AcceptInviteRoute } from "./openapi";
import { acceptInviteByToken } from "../../../services/invites/invites.service";

export const handleAcceptInvite: RouteHandler<
  AcceptInviteRoute,
  AppEnv
> = async (c) => {
  const { token } = c.req.valid("param");
  const res = await acceptInviteByToken(token);

  if ("error" in res) return c.json({ error: res.error }, 404);

  return c.json(
    {
      data: {
        homeId: res.homeId,
        userId: res.userId,
        status: "ACTIVE",
        joinedAt: res.joinedAt.toISOString(),
      },
    },
    200,
  );
};
