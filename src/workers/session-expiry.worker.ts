import { prisma } from "../lib/prisma";

const DEFAULT_SWEEP_INTERVAL_MS = 60_000;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startSessionExpiryWorker() {
  const sweepMs = envInt(
    "SESSION_EXPIRY_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );

  const tick = async () => {
    try {
      const res = await prisma.userSession.updateMany({
        where: {
          revokedAt: null,
          expiresAt: { lt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (res.count > 0) {
        console.log(
          `[session-expiry-worker] revoked expired sessions: ${res.count}`,
        );
      }
    } catch (e) {
      console.error("[session-expiry-worker] error:", e);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepMs);
  console.log(`[session-expiry-worker] started SWEEP=${sweepMs}ms`);
  return () => clearInterval(handle);
}
