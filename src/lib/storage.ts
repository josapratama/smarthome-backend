import { mkdir } from "node:fs/promises";
import path from "node:path";

export const STORAGE_DIR = process.env.STORAGE_DIR ?? "storage";

export function firmwareDirPath() {
  return path.join(STORAGE_DIR, "firmware");
}

export function firmwareBinPathByReleaseId(releaseId: number) {
  return path.join(firmwareDirPath(), `${releaseId}.bin`);
}

export async function ensureFirmwareDir() {
  await mkdir(firmwareDirPath(), { recursive: true });
}
