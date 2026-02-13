import { prisma } from "../lib/prisma";

const DEFAULT_OFFLINE_THRESHOLD_MS = 60_000;
const DEFAULT_SWEEP_INTERVAL_MS = 5_000;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startDeviceOfflineWorker() {
  const thresholdMs = envInt(
    "DEVICE_OFFLINE_THRESHOLD_MS",
    DEFAULT_OFFLINE_THRESHOLD_MS,
  );
  const sweepMs = envInt(
    "DEVICE_OFFLINE_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );

  const tick = async () => {
    try {
      const updatedCount = await prisma.$executeRaw<number>`
        UPDATE "device"
        SET "status" = FALSE,
            "updated_at" = now()
        WHERE "deleted_at" IS NULL
          AND "status" = TRUE
          AND "last_seen_at" IS NOT NULL
          AND "last_seen_at" < (now() - (${thresholdMs} * interval '1 millisecond'))
      `;

      if (updatedCount > 0) {
        console.log(`[device-offline-worker] marked OFFLINE: ${updatedCount}`);
      }
    } catch (err) {
      console.error("[device-offline-worker] error:", err);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepMs);

  console.log(
    `[device-offline-worker] started THRESHOLD=${thresholdMs}ms SWEEP=${sweepMs}ms`,
  );

  return () => clearInterval(handle);
}
