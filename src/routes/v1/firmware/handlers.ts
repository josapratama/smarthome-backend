import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { FirmwareService } from "../../../services/firmware/firmware.service";

import type {
  FirmwareListReleasesRoute,
  FirmwareUploadReleaseRoute,
  FirmwareDownloadReleaseRoute,
} from "./openapi";

function requireString(v: unknown, name: string) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${name} is required`);
  return s;
}

export const handleFirmwareListReleases: RouteHandler<
  FirmwareListReleasesRoute,
  AppEnv
> = async (c) => {
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
};

export const handleFirmwareUploadRelease: RouteHandler<
  FirmwareUploadReleaseRoute,
  AppEnv
> = async (c) => {
  try {
    const fd = await c.req.formData();

    console.log("[firmware] Upload request received");
    console.log("[firmware] FormData keys:", Array.from(fd.keys()));

    const platform = requireString(fd.get("platform"), "platform");
    const version = requireString(fd.get("version"), "version");
    const notes = fd.get("notes") ? String(fd.get("notes")) : undefined;

    const file = fd.get("file");
    if (!(file instanceof File)) throw new Error("file is required");

    console.log("[firmware] Platform:", platform);
    console.log("[firmware] Version:", version);
    console.log("[firmware] File:", file.name, file.size, "bytes");

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

    console.log("[firmware] Upload successful, ID:", release.id);

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
    console.error("[firmware] Upload error:", e.message);
    console.error("[firmware] Stack:", e.stack);
    // Prisma P2002 (unique) -> 409
    const code = String(e?.code) === "P2002" ? 409 : 400;
    return c.json({ error: e?.message ?? "BAD_REQUEST" }, code);
  }
};

export const handleFirmwareDownloadRelease: RouteHandler<
  FirmwareDownloadReleaseRoute,
  AppEnv
> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const res = await FirmwareService.getDownloadResponse(Number(id));
    return res;
  } catch (e: any) {
    return c.json({ error: e?.message ?? "NOT_FOUND" }, 404);
  }
};
