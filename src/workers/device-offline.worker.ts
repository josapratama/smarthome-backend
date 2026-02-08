import { prisma } from "../lib/prisma";

const DEFAULT_OFFLINE_THRESHOLD_MS = 60_000; // 60s
const DEFAULT_SWEEP_INTERVAL_MS = 5_000; // 5s

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Robust offline worker using Postgres time arithmetic:
 * - status=true
 * - last_seen_at is not null
 * - last_seen_at < now() - thresholdMs
 *
 * Uses SQL to avoid JS Date timezone/casting issues.
 */
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
        UPDATE "device_status"
        SET "status" = FALSE
        WHERE "status" = TRUE
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
