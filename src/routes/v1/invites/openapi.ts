import { createRoute, z } from "@hono/zod-openapi";
import { InviteToken, InviteAcceptResponse } from "./schemas";

export const acceptInviteRoute = createRoute({
  method: "get",
  path: "/invites/{token}",
  request: { params: z.object({ token: InviteToken }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: InviteAcceptResponse },
        "text/html": {
          schema: z.string().openapi({ example: "<html>...</html>" }),
        },
      },
      description: "Accept invite (returns JSON or HTML).",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
        "text/html": { schema: z.string() },
      },
      description: "Token invalid/expired/used",
    },
  },
});

export type AcceptInviteRoute = typeof acceptInviteRoute;
