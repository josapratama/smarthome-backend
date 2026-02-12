import { createRoute, z } from "@hono/zod-openapi";
import { InviteToken, InviteAcceptResponse } from "./schemas";

export const acceptInviteRoute = createRoute({
  method: "get",
  path: "/invites/{token}",
  request: { params: z.object({ token: InviteToken }) },
  responses: {
    200: {
      content: { "application/json": { schema: InviteAcceptResponse } },
      description: "Accept invite using token (no auth required).",
    },
    404: { description: "Token invalid/expired/used" },
  },
});

export type AcceptInviteRoute = typeof acceptInviteRoute;
