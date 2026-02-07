import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { AlarmCreateBody, AlarmDTO, EventsQuery } from "./schemas";
import { listHomeEvents, createHomeEvent, mapAlarmDTO } from "./handlers";

export function registerEventsRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}/events",
      request: {
        params: z.object({ homeId: HomeId }),
        query: EventsQuery,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(AlarmDTO) }),
            },
          },
          description: "Query home alarms/events.",
        },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const { from, to, limit } = c.req.valid("query");
      const events = await listHomeEvents(homeId, { from, to, limit });
      return c.json({ data: events.map(mapAlarmDTO) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/homes/{homeId}/events",
      request: {
        params: z.object({ homeId: HomeId }),
        body: { content: { "application/json": { schema: AlarmCreateBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: AlarmDTO }) },
          },
          description: "Create alarm_event.",
        },
        400: { description: "Device not in home / no sensor data" },
        404: { description: "Home/Device not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const body = c.req.valid("json");

      const res = await createHomeEvent(homeId, body);

      if ("error" in res) {
        if (res.error === "HOME_NOT_FOUND" || res.error === "DEVICE_NOT_FOUND")
          return c.json({ error: res.error }, 404);
        return c.json({ error: res.error }, 400);
      }

      return c.json({ data: mapAlarmDTO(res.alarm) }, 201);
    },
  );
}
