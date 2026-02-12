import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { prisma } from "../../../lib/prisma";
import type {
  DashboardRoute,
  HomeAttentionRoute,
  HomeOverviewRoute,
} from "./openapi";

function envInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function assertHomeAccess(homeId: number, userId: number) {
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: {
      id: true,
      name: true,
      city: true,
      updatedAt: true,
      ownerUserId: true,
      members: {
        where: { userId, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!home)
    return { ok: false, reason: "HOME_NOT_FOUND" as const, home: null };

  const isOwner = home.ownerUserId === userId;
  const isMember = home.members.length > 0;

  return {
    ok: isOwner || isMember,
    reason: isOwner || isMember ? null : ("FORBIDDEN" as const),
    home: {
      id: home.id,
      name: home.name,
      city: home.city ?? null,
      updatedAt: home.updatedAt,
    },
  };
}

function initRecord<K extends string>(keys: readonly K[], value = 0) {
  return keys.reduce(
    (acc, k) => {
      acc[k] = value;
      return acc;
    },
    {} as Record<K, number>,
  );
}

// ---- Dashboard ----
export const handleDashboard: RouteHandler<DashboardRoute, AppEnv> = async (
  c,
) => {
  const a = c.get("auth");
  const userId = a.user.id;

  // homes where owner or active member
  const homes = await prisma.home.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId, deletedAt: null, status: "ACTIVE" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      updatedAt: true,
      ownerUserId: true,
      members: {
        where: { userId, deletedAt: null, status: "ACTIVE" },
        select: { roleInHome: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const homeIds = homes.map((h) => h.id);

  // counts: devices online/offline
  const [deviceTotals, deviceOnline, openAlarms] = await Promise.all([
    prisma.device.groupBy({
      by: ["homeId"],
      where: { homeId: { in: homeIds }, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.device.groupBy({
      by: ["homeId"],
      where: { homeId: { in: homeIds }, deletedAt: null, status: true },
      _count: { _all: true },
    }),
    prisma.alarmEvent.groupBy({
      by: ["homeId"],
      where: { homeId: { in: homeIds }, status: "OPEN" },
      _count: { _all: true },
    }),
  ]);

  const totalByHome = new Map(
    deviceTotals.map((r) => [r.homeId, r._count._all]),
  );
  const onlineByHome = new Map(
    deviceOnline.map((r) => [r.homeId, r._count._all]),
  );
  const openAlarmsByHome = new Map(
    openAlarms.map((r) => [r.homeId, r._count._all]),
  );

  // pending invites: HomeMember invited for this user
  const pendingInvitesCount = await prisma.homeMember.count({
    where: { userId, deletedAt: null, status: "INVITED" },
  });

  const payloadHomes = homes.map((h) => {
    const total = totalByHome.get(h.id) ?? 0;
    const online = onlineByHome.get(h.id) ?? 0;
    const offline = Math.max(total - online, 0);
    const open = openAlarmsByHome.get(h.id) ?? 0;

    const roleInHome =
      h.ownerUserId === userId
        ? "OWNER"
        : (h.members[0]?.roleInHome ?? "MEMBER");

    return {
      id: h.id,
      name: h.name,
      city: h.city ?? null,
      updatedAt: h.updatedAt.toISOString(),
      roleInHome,
      devicesOnline: online,
      devicesOffline: offline,
      openAlarms: open,
    };
  });

  return c.json(
    {
      data: {
        myHomesCount: payloadHomes.length,
        pendingInvitesCount,
        homes: payloadHomes,
      },
    },
    200,
  );
};

// ---- Home Overview ----
export const handleHomeOverview: RouteHandler<
  HomeOverviewRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const userId = a.user.id;
  const { homeId } = c.req.valid("param");

  const access = await assertHomeAccess(Number(homeId), userId);
  if (!access.ok) {
    if (access.reason === "HOME_NOT_FOUND")
      return c.json({ error: "HOME_NOT_FOUND" }, 404);
    return c.json({ error: "FORBIDDEN" }, 403);
  }

  const DEVICE_TYPES = [
    "LIGHT",
    "FAN",
    "BELL",
    "DOOR",
    "SENSOR_NODE",
    "POWER_METER",
    "OTHER",
  ] as const;
  const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  const [
    total,
    online,
    byTypeRows,
    recentlySeen,
    openCount,
    bySeverityRows,
    latestAlarms,
    activeJobsCount,
    latestJobs,
  ] = await Promise.all([
    prisma.device.count({ where: { homeId: Number(homeId), deletedAt: null } }),
    prisma.device.count({
      where: { homeId: Number(homeId), deletedAt: null, status: true },
    }),
    prisma.device.groupBy({
      by: ["deviceType"],
      where: { homeId: Number(homeId), deletedAt: null },
      _count: { _all: true },
    }),
    prisma.device.findMany({
      where: { homeId: Number(homeId), deletedAt: null },
      orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        status: true,
        lastSeenAt: true,
        updatedAt: true,
      },
    }),
    prisma.alarmEvent.count({
      where: { homeId: Number(homeId), status: "OPEN" },
    }),
    prisma.alarmEvent.groupBy({
      by: ["severity"],
      where: { homeId: Number(homeId), status: "OPEN" },
      _count: { _all: true },
    }),
    prisma.alarmEvent.findMany({
      where: { homeId: Number(homeId) },
      orderBy: { triggeredAt: "desc" },
      take: 10,
      select: {
        id: true,
        deviceId: true,
        type: true,
        message: true,
        severity: true,
        status: true,
        source: true,
        triggeredAt: true,
      },
    }),
    prisma.otaJob.count({
      where: {
        device: { homeId: Number(homeId) },
        status: { in: ["PENDING", "SENT", "DOWNLOADING"] },
      },
    }),
    prisma.otaJob.findMany({
      where: { device: { homeId: Number(homeId) } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        deviceId: true,
        releaseId: true,
        status: true,
        progress: true,
        lastError: true,
        updatedAt: true,
      },
    }),
  ]);

  const byType = initRecord(DEVICE_TYPES, 0);
  for (const r of byTypeRows) {
    byType[r.deviceType as (typeof DEVICE_TYPES)[number]] = r._count._all;
  }

  const bySeverity = initRecord(SEVERITIES, 0);
  for (const r of bySeverityRows) {
    bySeverity[r.severity as (typeof SEVERITIES)[number]] = r._count._all;
  }

  return c.json(
    {
      data: {
        home: {
          id: access.home!.id,
          name: access.home!.name,
          city: access.home!.city,
          updatedAt: access.home!.updatedAt.toISOString(),
        },
        devices: {
          total,
          online,
          offline: Math.max(total - online, 0),
          byType,
          recentlySeen: recentlySeen.map((d) => ({
            id: d.id,
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            status: d.status,
            lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
            updatedAt: d.updatedAt.toISOString(),
          })),
        },
        alarms: {
          openCount,
          bySeverity,
          latest: latestAlarms.map((e) => ({
            id: e.id,
            deviceId: e.deviceId,
            type: e.type,
            message: e.message,
            severity: e.severity,
            status: e.status,
            source: e.source,
            triggeredAt: e.triggeredAt.toISOString(),
          })),
        },
        ota: {
          activeJobs: activeJobsCount,
          latestJobs: latestJobs.map((j) => ({
            id: j.id,
            deviceId: j.deviceId,
            releaseId: j.releaseId,
            status: j.status,
            progress: j.progress ?? null,
            lastError: j.lastError ?? null,
            updatedAt: j.updatedAt.toISOString(),
          })),
        },
      },
    },
    200,
  );
};

// ---- Attention ----
export const handleHomeAttention: RouteHandler<
  HomeAttentionRoute,
  AppEnv
> = async (c) => {
  const a = c.get("auth");
  const userId = a.user.id;
  const { homeId } = c.req.valid("param");
  const q = c.req.valid("query");
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 200);

  const access = await assertHomeAccess(Number(homeId), userId);
  if (!access.ok) {
    if (access.reason === "HOME_NOT_FOUND")
      return c.json({ error: "HOME_NOT_FOUND" }, 404);
    return c.json({ error: "FORBIDDEN" }, 403);
  }

  const offlineMinutes =
    q.offlineMinutes ?? envInt("DASHBOARD_OFFLINE_MINUTES", 5);
  const cutoff = new Date(Date.now() - offlineMinutes * 60_000);

  const [offlineDevices, openCriticalAlarms, failedOtaJobs, pendingInvites] =
    await Promise.all([
      prisma.device.findMany({
        where: {
          homeId: Number(homeId),
          deletedAt: null,
          OR: [{ status: false }, { lastSeenAt: { not: null, lt: cutoff } }],
        },
        orderBy: [{ lastSeenAt: "asc" }, { updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          deviceName: true,
          deviceType: true,
          status: true,
          lastSeenAt: true,
          updatedAt: true,
        },
      }),
      prisma.alarmEvent.findMany({
        where: {
          homeId: Number(homeId),
          status: "OPEN",
          severity: "CRITICAL",
        },
        orderBy: { triggeredAt: "desc" },
        take: limit,
        select: {
          id: true,
          deviceId: true,
          type: true,
          message: true,
          severity: true,
          status: true,
          source: true,
          triggeredAt: true,
        },
      }),
      prisma.otaJob.findMany({
        where: {
          device: { homeId: Number(homeId) },
          status: { in: ["FAILED", "TIMEOUT"] },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          deviceId: true,
          releaseId: true,
          status: true,
          progress: true,
          lastError: true,
          updatedAt: true,
        },
      }),
      prisma.homeMember.findMany({
        where: { homeId: Number(homeId), deletedAt: null, status: "INVITED" },
        orderBy: { invitedAt: "asc" },
        take: limit,
        select: { id: true, userId: true, roleInHome: true, invitedAt: true },
      }),
    ]);

  return c.json(
    {
      data: {
        offlineDevices: offlineDevices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          deviceType: d.deviceType,
          status: d.status,
          lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
          updatedAt: d.updatedAt.toISOString(),
        })),
        openCriticalAlarms: openCriticalAlarms.map((e) => ({
          id: e.id,
          deviceId: e.deviceId,
          type: e.type,
          message: e.message,
          severity: e.severity,
          status: e.status,
          source: e.source,
          triggeredAt: e.triggeredAt.toISOString(),
        })),
        failedOtaJobs: failedOtaJobs.map((j) => ({
          id: j.id,
          deviceId: j.deviceId,
          releaseId: j.releaseId,
          status: j.status,
          progress: j.progress ?? null,
          lastError: j.lastError ?? null,
          updatedAt: j.updatedAt.toISOString(),
        })),
        pendingInvites: pendingInvites.map((m) => ({
          homeMemberId: m.id,
          userId: m.userId,
          roleInHome: m.roleInHome,
          invitedAt: m.invitedAt.toISOString(),
        })),
      },
    },
    200,
  );
};
