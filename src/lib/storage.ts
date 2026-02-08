import { mkdir } from "fs/promises";
import path from "path";

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
