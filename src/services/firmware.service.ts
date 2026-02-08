import crypto from "node:crypto";
import { prisma } from "../lib/prisma";
import { ensureFirmwareDir, firmwareBinPathByReleaseId } from "../lib/storage";

export type CreateFirmwareReleaseInput = {
  platform: string; // e.g. "esp32"
  version: string;
  notes?: string | null;
  file: File;
};

function toHex(buf: ArrayBuffer) {
  return Buffer.from(buf).toString("hex");
}

async function sha256OfFile(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const digest = await crypto.webcrypto.subtle.digest("SHA-256", ab);
  return toHex(digest);
}

export class FirmwareService {
  static async createReleaseFromUpload(input: CreateFirmwareReleaseInput) {
    await ensureFirmwareDir();

    const sizeBytes = input.file.size;
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new Error("Invalid firmware file size");
    }

    const sha256 = await sha256OfFile(input.file);

    // Dedup (optional): kalau sha256 sudah ada, balikin yang lama
    const existing = await prisma.firmwareRelease.findUnique({
      where: { sha256 },
    });
    if (existing) {
      return existing;
    }

    // Create row dulu (biar dapat id untuk filename)
    const created = await prisma.firmwareRelease.create({
      data: {
        platform: input.platform,
        version: input.version,
        sha256,
        sizeBytes,
        filePath: "", // akan diupdate setelah file ditulis
        notes: input.notes ?? null,
      },
    });

    // Tulis file ke disk pakai id
    const finalPath = firmwareBinPathByReleaseId(created.id);
    const bytes = new Uint8Array(await input.file.arrayBuffer());
    await Bun.write(finalPath, bytes);

    // Update filePath di DB
    const updated = await prisma.firmwareRelease.update({
      where: { id: created.id },
      data: { filePath: finalPath },
    });

    return updated;
  }

  static async getReleaseOrThrow(id: number) {
    const release = await prisma.firmwareRelease.findUnique({ where: { id } });
    if (!release) throw new Error("Firmware release not found");
    return release;
  }

  static async getDownloadResponse(releaseId: number) {
    const release = await this.getReleaseOrThrow(releaseId);
    if (!release.filePath) throw new Error("Firmware filePath missing");

    const f = Bun.file(release.filePath);
    if (!(await f.exists())) {
      throw new Error("Firmware file not found on disk");
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Length", String(release.sizeBytes));
    headers.set("ETag", release.sha256);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${release.platform}-${release.version}-${release.id}.bin"`,
    );

    return new Response(f, { status: 200, headers });
  }

  static async listReleases(params?: { platform?: string; limit?: number }) {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    return prisma.firmwareRelease.findMany({
      where: params?.platform ? { platform: params.platform } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
