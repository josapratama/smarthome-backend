import { prisma } from "../lib/prisma";

const DEFAULT_ACK_TIMEOUT_MS = 30_000;
const DEFAULT_SWEEP_INTERVAL_MS = 5_000;

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function startCommandTimeoutWorker() {
  const ackTimeoutMs = envInt("COMMAND_ACK_TIMEOUT_MS", DEFAULT_ACK_TIMEOUT_MS);
  const sweepIntervalMs = envInt(
    "COMMAND_TIMEOUT_SWEEP_INTERVAL_MS",
    DEFAULT_SWEEP_INTERVAL_MS,
  );

  const tick = async () => {
    const cutoff = new Date(Date.now() - ackTimeoutMs);

    try {
      // Ambil command yang perlu ditimeout (ambil id untuk sync ke OtaJob)
      const cmds = await prisma.command.findMany({
        where: {
          status: "SENT",
          ackedAt: null,
          createdAt: { lt: cutoff },
        },
        select: { id: true },
        take: 500,
      });

      if (cmds.length === 0) return;

      const ids = cmds.map((c) => c.id);

      const res = await prisma.command.updateMany({
        where: { id: { in: ids }, status: "SENT", ackedAt: null },
        data: { status: "TIMEOUT", lastError: "ACK_TIMEOUT" },
      });

      // Sync ke OtaJob (jika commandId dipakai oleh otaJob)
      const now = new Date();
      await prisma.otaJob.updateMany({
        where: {
          commandId: { in: ids },
          status: { in: ["PENDING", "SENT", "DOWNLOADING"] },
        },
        data: {
          status: "TIMEOUT",
          lastError: "COMMAND_TIMEOUT",
          failedAt: now,
        },
      });

      if (res.count > 0) {
        console.log(`[command-timeout-worker] TIMEOUT ${res.count} command(s)`);
      }
    } catch (err) {
      console.error("[command-timeout-worker] error:", err);
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), sweepIntervalMs);

  console.log(
    `[command-timeout-worker] started ACK_TIMEOUT=${ackTimeoutMs}ms SWEEP=${sweepIntervalMs}ms`,
  );

  return () => clearInterval(handle);
}
