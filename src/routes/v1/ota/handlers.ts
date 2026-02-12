import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { OtaService } from "../../../services/ota/ota.service";

import type {
  TriggerOtaRoute,
  GetOtaJobRoute,
  ListDeviceOtaJobsRoute,
} from "./openapi";

function mapJob(job: any) {
  return {
    id: job.id,
    deviceId: job.deviceId,
    releaseId: job.releaseId,

    status: job.status,
    progress: job.progress ?? null,
    lastError: job.lastError ?? null,

    sentAt: job.sentAt ? job.sentAt.toISOString() : null,
    downloadingAt: job.downloadingAt ? job.downloadingAt.toISOString() : null,
    appliedAt: job.appliedAt ? job.appliedAt.toISOString() : null,
    failedAt: job.failedAt ? job.failedAt.toISOString() : null,

    commandId: job.commandId ?? null,

    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

// POST trigger OTA
export const handleTriggerOta: RouteHandler<TriggerOtaRoute, AppEnv> = async (
  c,
) => {
  try {
    const { deviceId } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await OtaService.triggerDeviceOta({
      requestUrl: c.req.url,
      deviceId: Number(deviceId),
      releaseId: Number(body.releaseId),
    });

    // normalisasi response biar match schema prisma terbaru
    return c.json(
      {
        data: {
          otaJobId: result.otaJobId,
          commandId: result.commandId ?? null,
          status: result.status, // should be OtaJobStatus
        },
      },
      201,
    );
  } catch (e: any) {
    const msg = e?.message ?? "BAD_REQUEST";
    const code = String(msg).toLowerCase().includes("not found") ? 404 : 400;
    return c.json({ error: msg }, code);
  }
};

// GET job detail
export const handleGetOtaJob: RouteHandler<GetOtaJobRoute, AppEnv> = async (
  c,
) => {
  try {
    const { otaJobId } = c.req.valid("param");
    const job = await OtaService.getOtaJobOrThrow(Number(otaJobId));
    return c.json({ data: mapJob(job) }, 200);
  } catch (e: any) {
    return c.json({ error: e?.message ?? "NOT_FOUND" }, 404);
  }
};

// GET list jobs by device
export const handleListDeviceOtaJobs: RouteHandler<
  ListDeviceOtaJobsRoute,
  AppEnv
> = async (c) => {
  const { deviceId } = c.req.valid("param");
  const q = c.req.valid("query");

  const rows = await OtaService.listDeviceOtaJobs(
    Number(deviceId),
    q.limit ?? 50,
  );
  return c.json({ data: rows.map(mapJob) }, 200);
};
