import { createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { AlarmCreateBody, AlarmDTO, AlarmId, AlarmsQuery } from "./schemas";

// GET /api/v1/homes/{homeId}/alarms
export const listHomeAlarmsRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/alarms",
  request: {
    params: z.object({ homeId: HomeId }),
    query: AlarmsQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(AlarmDTO) }) },
      },
      description: "List alarms for a home.",
    },
  },
  tags: ["Alarms"],
});
export type ListHomeAlarmsRoute = typeof listHomeAlarmsRoute;

// POST /api/v1/homes/{homeId}/alarms
export const createHomeAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: AlarmCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Create alarm_event.",
    },
    400: { description: "Bad request" },
    404: { description: "Home/Device/Sensor ref not found" },
  },
  tags: ["Alarms"],
});
export type CreateHomeAlarmRoute = typeof createHomeAlarmRoute;

// POST /api/v1/homes/{homeId}/alarms/{alarmId}/ack
export const ackAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms/{alarmId}/ack",
  request: {
    params: z.object({ homeId: HomeId, alarmId: AlarmId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Acknowledge alarm.",
    },
    404: { description: "Not found" },
    400: { description: "Invalid state" },
  },
  tags: ["Alarms"],
});
export type AckAlarmRoute = typeof ackAlarmRoute;

// POST /api/v1/homes/{homeId}/alarms/{alarmId}/resolve
export const resolveAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms/{alarmId}/resolve",
  request: {
    params: z.object({ homeId: HomeId, alarmId: AlarmId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Resolve alarm.",
    },
    404: { description: "Not found" },
    400: { description: "Invalid state" },
  },
  tags: ["Alarms"],
});
export type ResolveAlarmRoute = typeof resolveAlarmRoute;
