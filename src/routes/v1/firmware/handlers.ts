import { FirmwareService } from "../../../services/firmware.service";

export async function listReleases(params: {
  platform?: string;
  limit?: number;
}) {
  const releases = await FirmwareService.listReleases(params);
  return releases.map((r) => ({
    id: r.id,
    platform: r.platform,
    version: r.version,
    sha256: r.sha256,
    sizeBytes: r.sizeBytes,
    filePath: r.filePath,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function downloadRelease(id: number) {
  return FirmwareService.getDownloadResponse(id);
}
