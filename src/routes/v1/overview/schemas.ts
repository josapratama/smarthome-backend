import { z } from "@hono/zod-openapi";
import { HomeId, DeviceId } from "../common/ids";

// ---------- Shared ----------
export const ISODateTime = z.string().datetime();

export const HomeSummaryDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    city: z.string().nullable(),
    updatedAt: ISODateTime,
    roleInHome: z.enum(["OWNER", "MEMBER", "GUEST"]),
    devicesOnline: z.number().int().nonnegative(),
    devicesOffline: z.number().int().nonnegative(),
    openAlarms: z.number().int().nonnegative(),
  })
  .openapi("HomeSummaryDTO");

export const DashboardResponse = z
  .object({
    data: z.object({
      myHomesCount: z.number().int().nonnegative(),
      pendingInvitesCount: z.number().int().nonnegative(),
      homes: z.array(HomeSummaryDTO),
    }),
  })
  .openapi("DashboardResponse");

// ---------- Home Overview ----------
export const DeviceTypeEnum = z.enum([
  "LIGHT",
  "FAN",
  "BELL",
  "DOOR",
  "SENSOR_NODE",
  "POWER_METER",
  "OTHER",
]);

export const DeviceMiniDTO = z
  .object({
    id: DeviceId,
    deviceName: z.string(),
    deviceType: DeviceTypeEnum,
    status: z.boolean(),
    lastSeenAt: ISODateTime.nullable(),
    updatedAt: ISODateTime,
  })
  .openapi("DeviceMiniDTO");

export const AlarmSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const AlarmStatusEnum = z.enum(["OPEN", "ACKED", "RESOLVED"]);
export const AlarmSourceEnum = z.enum(["DEVICE", "BACKEND", "AI", "USER"]);

export const AlarmMiniDTO = z
  .object({
    id: z.number().int().positive(),
    deviceId: DeviceId,
    type: z.string(),
    message: z.string(),
    severity: AlarmSeverityEnum,
    status: AlarmStatusEnum,
    source: AlarmSourceEnum,
    triggeredAt: ISODateTime,
  })
  .openapi("AlarmMiniDTO");

export const OtaJobStatusEnum = z.enum([
  "PENDING",
  "SENT",
  "DOWNLOADING",
  "APPLIED",
  "FAILED",
  "TIMEOUT",
]);

export const OtaJobMiniDTO = z
  .object({
    id: z.number().int().positive(),
    deviceId: DeviceId,
    releaseId: z.number().int().positive(),
    status: OtaJobStatusEnum,
    progress: z.number().nullable(),
    lastError: z.string().nullable(),
    updatedAt: ISODateTime,
  })
  .openapi("OtaJobMiniDTO");

export const HomeOverviewParams = z.object({ homeId: HomeId });

export const HomeOverviewResponse = z
  .object({
    data: z.object({
      home: z.object({
        id: HomeId,
        name: z.string(),
        city: z.string().nullable(),
        updatedAt: ISODateTime,
      }),
      devices: z.object({
        total: z.number().int().nonnegative(),
        online: z.number().int().nonnegative(),
        offline: z.number().int().nonnegative(),
        byType: z.record(DeviceTypeEnum, z.number().int().nonnegative()),
        recentlySeen: z.array(DeviceMiniDTO),
      }),
      alarms: z.object({
        openCount: z.number().int().nonnegative(),
        bySeverity: z.record(AlarmSeverityEnum, z.number().int().nonnegative()),
        latest: z.array(AlarmMiniDTO),
      }),
      ota: z.object({
        activeJobs: z.number().int().nonnegative(),
        latestJobs: z.array(OtaJobMiniDTO),
      }),
    }),
  })
  .openapi("HomeOverviewResponse");

// ---------- Attention ----------
export const AttentionResponse = z
  .object({
    data: z.object({
      offlineDevices: z.array(DeviceMiniDTO),
      openCriticalAlarms: z.array(AlarmMiniDTO),
      failedOtaJobs: z.array(OtaJobMiniDTO),
      pendingInvites: z.array(
        z.object({
          homeMemberId: z.number().int().positive(),
          userId: z.number().int().positive(),
          roleInHome: z.enum(["OWNER", "MEMBER", "GUEST"]),
          invitedAt: ISODateTime,
        }),
      ),
    }),
  })
  .openapi("AttentionResponse");

export const ErrorResponse = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");
