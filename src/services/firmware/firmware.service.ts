import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "../../lib/prisma";

function safeName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

async function sha256OfBuffer(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export class FirmwareService {
  static async listReleases(params: { platform?: string; limit?: number }) {
    return prisma.firmwareRelease.findMany({
      where: {
        deletedAt: null,
        platform: params.platform ? params.platform : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(params.limit ?? 50, 1), 100),
    });
  }

  static async createReleaseFromUpload(args: {
    platform: string;
    version: string;
    notes: string | null;
    file: File;
  }) {
    const arrayBuf = await args.file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    const sha256 = await sha256OfBuffer(buf);
    const sizeBytes = buf.byteLength;

    // lokasi penyimpanan file (ubah sesuai projectmu)
    // contoh: /uploads/firmware/<platform>/<version>-<sha>.bin
    const uploadsDir = process.env.FIRMWARE_UPLOAD_DIR
      ? path.resolve(process.env.FIRMWARE_UPLOAD_DIR)
      : path.resolve(process.cwd(), "uploads", "firmware");

    const platformDir = path.join(uploadsDir, safeName(args.platform));
    await fs.mkdir(platformDir, { recursive: true });

    const filename = `${safeName(args.version)}-${sha256}.bin`;
    const filePath = path.join(platformDir, filename);

    // tulis file ke disk
    await fs.writeFile(filePath, buf);

    // simpan record firmware release (schema terbaru ada deletedAt)
    // sha256 unique -> kalau duplicate, Prisma akan throw P2002
    const release = await prisma.firmwareRelease.create({
      data: {
        platform: args.platform,
        version: args.version,
        sha256,
        sizeBytes,
        filePath,
        notes: args.notes,
      },
    });

    return release;
  }

  static async getDownloadResponse(id: number) {
    const release = await prisma.firmwareRelease.findFirst({
      where: { id, deletedAt: null },
    });
    if (!release) throw new Error("NOT_FOUND");

    const buf = await fs.readFile(release.filePath);

    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="firmware-${release.platform}-${release.version}.bin"`,
        "content-length": String(buf.byteLength),
        "x-firmware-sha256": release.sha256,
      },
    });
  }
}
