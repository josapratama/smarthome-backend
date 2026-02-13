import { createRoute, z } from "@hono/zod-openapi";
import { InviteToken, InviteAcceptResponse } from "./schemas";

export const acceptInviteRoute = createRoute({
  method: "get",
  path: "/api/v1/invites/{token}",
  summary: "Accept home invitation",
  description:
    "Accept a home invitation using a unique token received via email or link. This endpoint can return either JSON data for API clients or HTML for web browsers.",
  request: { params: z.object({ token: InviteToken }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: InviteAcceptResponse },
        "text/html": {
          schema: z.string().openapi({ example: "<html>...</html>" }),
        },
      },
      description: "Invitation accepted successfully",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
        "text/html": { schema: z.string() },
      },
      description: "Invalid, expired, or already used invitation token",
    },
  },
  tags: ["Home Invitations"],
});

export type AcceptInviteRoute = typeof acceptInviteRoute;
