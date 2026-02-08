import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { FirmwareService } from "../../../services/firmware.service";
import {
  FirmwareReleaseId,
  FirmwareReleaseUploadBody,
  FirmwareReleaseResponse,
  FirmwareReleaseListResponse,
} from "./schemas";

function requireString(v: unknown, name: string) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${name} is required`);
  return s;
}

export function registerFirmwareRoutes(app: OpenAPIHono<AppEnv>) {
  // GET /api/v1/firmware/releases
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/firmware/releases",
      request: {
        query: z.object({
          platform: z.string().optional(),
          limit: z.coerce.number().int().min(1).max(100).optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: FirmwareReleaseListResponse },
          },
          description: "List firmware releases.",
        },
      },
    }),
    async (c) => {
      const q = c.req.valid("query");
      const releases = await FirmwareService.listReleases({
        platform: q.platform || undefined,
        limit: q.limit,
      });

      return c.json(
        {
          data: releases.map((r) => ({
            id: r.id,
            platform: r.platform,
            version: r.version,
            sha256: r.sha256,
            sizeBytes: r.sizeBytes,
            filePath: r.filePath,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
          })),
        },
        200,
      );
    },
  );

  // POST /api/v1/firmware/releases (multipart)
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/firmware/releases",
      request: {
        body: {
          content: {
            "multipart/form-data": {
              schema: FirmwareReleaseUploadBody,
            },
          },
        },
      },
      responses: {
        201: {
          content: { "application/json": { schema: FirmwareReleaseResponse } },
          description: "Upload a firmware release.",
        },
        400: { description: "Bad request" },
        409: { description: "Duplicate firmware" },
      },
    }),
    async (c) => {
      try {
        const fd = await c.req.formData();
        const platform = requireString(fd.get("platform"), "platform");
        const version = requireString(fd.get("version"), "version");
        const notes = fd.get("notes") ? String(fd.get("notes")) : undefined;

        const file = fd.get("file");
        if (!(file instanceof File)) throw new Error("file is required");

        const release = await FirmwareService.createReleaseFromUpload({
          platform,
          version,
          notes: notes ?? null,
          file,
        });

        const baseUrl = (
          process.env.PUBLIC_BASE_URL ?? new URL(c.req.url).origin
        ).replace(/\/+$/, "");
        const downloadUrl = `${baseUrl}/api/v1/firmware/releases/${release.id}/download`;

        return c.json(
          {
            data: {
              id: release.id,
              platform: release.platform,
              version: release.version,
              sha256: release.sha256,
              sizeBytes: release.sizeBytes,
              downloadUrl,
              createdAt: release.createdAt.toISOString(),
            },
          },
          201,
        );
      } catch (e: any) {
        const msg = e?.message ?? "BAD_REQUEST";
        // kalau mau: map Prisma P2002 -> 409
        return c.json({ error: msg }, 400);
      }
    },
  );

  // GET /api/v1/firmware/releases/{id}/download
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/firmware/releases/{id}/download",
      request: {
        params: z.object({ id: FirmwareReleaseId }),
      },
      responses: {
        200: {
          content: {
            "application/octet-stream": { schema: z.any() },
          },
          description: "Download firmware binary.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const res = await FirmwareService.getDownloadResponse(Number(id));
        return res;
      } catch (e: any) {
        return c.json({ error: e?.message ?? "NOT_FOUND" }, 404);
      }
    },
  );
}
