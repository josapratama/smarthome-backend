import { prisma } from "../lib/prisma";

const DEFAULT_SWEEP_INTERVAL_MS = 10 * 60_000; // 10 menit
const DEFAULT_RETENTION_DAYS = 7;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startPasswordResetCleanupWorker() {
  const sweepMs = envInt(
    "PASSWORD_RESET_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );
  const retentionDays = envInt(
    "PASSWORD_RESET_RETENTION_DAYS",
    DEFAULT_RETENTION_DAYS,
  );

  const tick = async () => {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const res = await prisma.passwordReset.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { usedAt: { not: null }, createdAt: { lt: cutoff } },
          ],
        },
      });

      if (res.count > 0) {
        console.log(`[password-reset-cleanup] deleted rows: ${res.count}`);
      }
    } catch (e) {
      console.error("[password-reset-cleanup] error:", e);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepMs);
  console.log(
    `[password-reset-cleanup] started SWEEP=${sweepMs}ms RETENTION=${retentionDays}d`,
  );
  return () => clearInterval(handle);
}
