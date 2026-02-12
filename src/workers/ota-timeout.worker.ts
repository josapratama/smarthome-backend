import { prisma } from "../lib/prisma";

const OTA_TIMEOUT_MS = Number(process.env.OTA_TIMEOUT_MS ?? 10 * 60 * 1000);
const OTA_SWEEP_INTERVAL_MS = Number(
  process.env.OTA_SWEEP_INTERVAL_MS ?? 30 * 1000,
);

export function startOtaTimeoutWorker() {
  const interval = setInterval(async () => {
    const cutoff = new Date(Date.now() - OTA_TIMEOUT_MS);

    try {
      const candidates = await prisma.otaJob.findMany({
        where: {
          status: { in: ["PENDING", "SENT", "DOWNLOADING"] },
          updatedAt: { lt: cutoff },
        },
        select: { id: true, commandId: true },
        take: 500,
      });

      if (candidates.length === 0) return;

      const ids = candidates.map((c) => c.id);
      const now = new Date();

      await prisma.otaJob.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "TIMEOUT",
          lastError: "OTA_TIMEOUT",
          failedAt: now,
        },
      });

      const commandIds = candidates
        .map((c) => c.commandId)
        .filter((x): x is number => !!x);

      if (commandIds.length) {
        await prisma.command.updateMany({
          where: {
            id: { in: commandIds },
            status: { in: ["PENDING", "SENT"] },
          },
          data: { status: "TIMEOUT", lastError: "OTA_TIMEOUT" },
        });
      }

      console.log(`[worker][ota-timeout] timed out ${ids.length} jobs`);
    } catch (e) {
      console.error("[worker][ota-timeout] error", e);
    }
  }, OTA_SWEEP_INTERVAL_MS);

  console.log(
    `[worker][ota-timeout] started TIMEOUT=${OTA_TIMEOUT_MS}ms SWEEP=${OTA_SWEEP_INTERVAL_MS}ms`,
  );

  return () => clearInterval(interval);
}
