import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import type { AcceptInviteRoute } from "./openapi";
import { acceptInviteByToken } from "../../../services/invites/invites.service";

function wantsHtml(accept: string | undefined) {
  if (!accept) return false;
  return accept.includes("text/html");
}

function htmlPage(title: string, message: string) {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; background:#0b1020; color:#e5e7eb; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
    .card { background:#111827; border: 1px solid #1f2937; border-radius: 16px; padding: 22px; }
    h1 { font-size: 20px; margin: 0 0 10px; }
    p { margin: 0; line-height: 1.55; color:#cbd5e1; }
    .hint { margin-top: 14px; font-size: 13px; color:#94a3b8; }
    a { color:#93c5fd; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <p class="hint">Kamu bisa menutup halaman ini. Frontend akan dibuat menyusul.</p>
    </div>
  </div>
</body>
</html>`;
}

export const handleAcceptInvite: RouteHandler<
  AcceptInviteRoute,
  AppEnv
> = async (c) => {
  const { token } = c.req.valid("param");
  const accept = c.req.header("accept");

  const res = await acceptInviteByToken(token);

  const isHtml = wantsHtml(accept);

  if ("error" in res) {
    if (isHtml) {
      return c.html(
        htmlPage(
          "Undangan tidak valid",
          "Link undangan ini sudah kedaluwarsa, sudah dipakai, atau tidak valid.",
        ),
        404,
      );
    }
    return c.json({ error: res.error }, 404);
  }

  if (isHtml) {
    return c.html(
      htmlPage(
        "Undangan diterima ✅",
        `Undangan berhasil diterima. (homeId: ${res.homeId}, userId: ${res.userId})`,
      ),
      200,
    );
  }

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
