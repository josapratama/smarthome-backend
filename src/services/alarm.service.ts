import { prisma } from "../lib/prisma";
import type {
  AlarmSeverity,
  AlarmSource,
} from "../lib/generated/prisma/client";

export type AlarmType = "GAS" | "FLAME" | "TRASH" | "POWER";

type TelemetryLike = {
  current: number;
  gasPpm: number;
  flame: boolean;
  binLevel: number;
};

type CreateAlarmArgs = {
  sensorId: number; // Int
  deviceId: number; // Int
  homeId?: number | null; // Int?
  telemetry: TelemetryLike;
  source?: AlarmSource; // enum AlarmSource
};

const DEDUP_WINDOW_MS = 60_000;

function buildAlarmCandidates(t: TelemetryLike): Array<{
  type: AlarmType;
  severity: AlarmSeverity;
  message: string;
}> {
  const out: Array<{
    type: AlarmType;
    severity: AlarmSeverity;
    message: string;
  }> = [];

  if (t.gasPpm > 500) {
    out.push({
      type: "GAS",
      severity: "CRITICAL",
      message: `Gas tinggi terdeteksi: ${t.gasPpm} ppm (> 500).`,
    });
  }

  if (t.flame === true) {
    out.push({
      type: "FLAME",
      severity: "CRITICAL",
      message: "Api terdeteksi (flame=true).",
    });
  }

  if (t.binLevel > 80) {
    out.push({
      type: "TRASH",
      severity: "MEDIUM",
      message: `Tempat sampah hampir penuh: ${t.binLevel}% (> 80%).`,
    });
  }

  // Optional POWER rule via env
  const thrStr = process.env.POWER_CURRENT_THRESHOLD;
  if (thrStr) {
    const thr = Number(thrStr);
    if (Number.isFinite(thr) && t.current > thr) {
      out.push({
        type: "POWER",
        severity: "HIGH",
        message: `Arus tinggi: ${t.current}A (> ${thr}A).`,
      });
    }
  }

  return out;
}

export async function processAlarmsFromTelemetry(args: CreateAlarmArgs) {
  const { sensorId, deviceId, homeId, telemetry } = args;
  const source: AlarmSource = args.source ?? "DEVICE";

  const candidates = buildAlarmCandidates(telemetry);
  if (candidates.length === 0) return [];

  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const created = [];

  for (const c of candidates) {
    // NOTE: schema pakai triggeredAt, bukan createdAt
    const existing = await prisma.alarmEvent.findFirst({
      where: {
        deviceId,
        type: c.type,
        source,
        triggeredAt: { gte: since },
      },
      select: { id: true },
    });

    if (existing) continue;

    const row = await prisma.alarmEvent.create({
      data: {
        sensorId,
        deviceId,
        homeId: homeId ?? null,
        type: c.type,
        severity: c.severity,
        message: c.message,
        source, // AlarmSource enum
        // triggeredAt default now() di schema -> gak perlu set
      },
    });

    created.push(row);
  }

  return created;
}
