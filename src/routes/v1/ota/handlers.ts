import { OtaService } from "../../../services/ota.service";

export async function triggerDeviceOta(input: {
  requestUrl: string;
  deviceId: number;
  releaseId: number;
}) {
  const result = await OtaService.triggerDeviceOta({
    requestUrl: input.requestUrl,
    deviceId: input.deviceId,
    releaseId: input.releaseId,
  });

  return result; // { otaJobId, commandId, status }
}

export async function getJob(input: { otaJobId: number }) {
  const job = await OtaService.getOtaJobOrThrow(input.otaJobId);

  return {
    id: job.id,
    deviceId: job.deviceId,
    releaseId: job.releaseId,
    status: job.status,
    progress: job.progress ?? null,
    lastError: job.lastError ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function listDeviceJobs(input: {
  deviceId: number;
  limit?: number;
}) {
  const rows = await OtaService.listDeviceOtaJobs(
    input.deviceId,
    input.limit ?? 50,
  );

  return rows.map((job) => ({
    id: job.id,
    deviceId: job.deviceId,
    releaseId: job.releaseId,
    status: job.status,
    progress: job.progress ?? null,
    lastError: job.lastError ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));
}
