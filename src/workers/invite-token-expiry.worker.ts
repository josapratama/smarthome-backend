import { prisma } from "../lib/prisma";

const DEFAULT_SWEEP_INTERVAL_MS = 60_000;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startInviteTokenExpiryWorker() {
  const sweepMs = envInt(
    "INVITE_TOKEN_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );

  const tick = async () => {
    try {
      const res = await prisma.homeInviteToken.deleteMany({
        where: {
          usedAt: null,
          expiresAt: { lt: new Date() },
        },
      });

      if (res.count > 0) {
        console.log(
          `[invite-token-expiry-worker] deleted expired tokens: ${res.count}`,
        );
      }
    } catch (e) {
      console.error("[invite-token-expiry-worker] error:", e);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepMs);
  console.log(`[invite-token-expiry-worker] started SWEEP=${sweepMs}ms`);
  return () => clearInterval(handle);
}
