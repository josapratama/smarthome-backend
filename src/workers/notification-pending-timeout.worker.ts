import { prisma } from "../lib/prisma";

const DEFAULT_PENDING_TIMEOUT_MS = 2 * 60 * 1000; // 2 menit
const DEFAULT_SWEEP_INTERVAL_MS = 30_000;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startNotificationPendingTimeoutWorker() {
  const pendingTimeoutMs = envInt(
    "NOTIF_PENDING_TIMEOUT_MS",
    DEFAULT_PENDING_TIMEOUT_MS,
  );
  const sweepMs = envInt(
    "NOTIF_PENDING_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );

  const tick = async () => {
    const cutoff = new Date(Date.now() - pendingTimeoutMs);

    try {
      const res = await prisma.notificationLog.updateMany({
        where: {
          status: "PENDING",
          createdAt: { lt: cutoff },
        },
        data: {
          status: "FAILED",
          providerResponse: "PENDING_TIMEOUT",
          sentAt: new Date(),
        },
      });

      if (res.count > 0) {
        console.log(
          `[notification-pending-timeout] marked FAILED: ${res.count}`,
        );
      }
    } catch (e) {
      console.error("[notification-pending-timeout] error:", e);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepMs);
  console.log(
    `[notification-pending-timeout] started TIMEOUT=${pendingTimeoutMs}ms SWEEP=${sweepMs}ms`,
  );
  return () => clearInterval(handle);
}
