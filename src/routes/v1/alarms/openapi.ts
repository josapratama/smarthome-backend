import { createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { AlarmCreateBody, AlarmDTO, AlarmId, AlarmsQuery } from "./schemas";

// GET /api/v1/homes/{homeId}/alarms
export const listHomeAlarmsRoute = createRoute({
  method: "get",
  path: "/api/v1/homes/{homeId}/alarms",
  summary: "List home alarms",
  description:
    "Retrieve all alarm events for a home including security alerts, sensor warnings, device malfunctions, and AI-detected anomalies. Supports filtering by status and severity.",
  request: {
    params: z.object({ homeId: HomeId }),
    query: AlarmsQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(AlarmDTO) }) },
      },
      description: "Home alarms retrieved successfully",
    },
  },
  tags: ["Alarm Management"],
});

// POST /api/v1/homes/{homeId}/alarms
export const createHomeAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms",
  summary: "Create alarm event",
  description:
    "Manually create an alarm event for a home. This can be used for testing, manual alerts, or integration with external security systems.",
  request: {
    params: z.object({ homeId: HomeId }),
    body: { content: { "application/json": { schema: AlarmCreateBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Alarm event created successfully",
    },
    400: { description: "Bad request - invalid alarm data" },
    404: { description: "Home, device, or sensor reference not found" },
  },
  tags: ["Alarm Management"],
});

// POST /api/v1/homes/{homeId}/alarms/{alarmId}/ack
export const ackAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms/{alarmId}/ack",
  summary: "Acknowledge alarm",
  description:
    "Mark an alarm as acknowledged by the current user. This indicates that the alarm has been seen and is being addressed, but not yet resolved.",
  request: {
    params: z.object({ homeId: HomeId, alarmId: AlarmId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Alarm acknowledged successfully",
    },
    404: { description: "Alarm not found" },
    400: { description: "Invalid state - alarm cannot be acknowledged" },
  },
  tags: ["Alarm Management"],
});

// POST /api/v1/homes/{homeId}/alarms/{alarmId}/resolve
export const resolveAlarmRoute = createRoute({
  method: "post",
  path: "/api/v1/homes/{homeId}/alarms/{alarmId}/resolve",
  summary: "Resolve alarm",
  description:
    "Mark an alarm as resolved, indicating that the underlying issue has been fixed and the alarm can be closed. This is the final state for an alarm.",
  request: {
    params: z.object({ homeId: HomeId, alarmId: AlarmId }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: AlarmDTO }) } },
      description: "Alarm resolved successfully",
    },
    404: { description: "Alarm not found" },
    400: { description: "Invalid state - alarm cannot be resolved" },
  },
  tags: ["Alarm Management"],
});
