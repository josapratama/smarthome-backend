import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import {
  DeviceId,
  OtaJobId,
  TriggerOtaBody,
  TriggerOtaResponse,
  OtaJobResponse,
  OtaJobListResponse,
} from "./schemas";
import { triggerDeviceOta, getJob, listDeviceJobs } from "./handlers";

export function registerOtaRoutes(app: OpenAPIHono<AppEnv>) {
  // POST /api/v1/ota/devices/{deviceId}
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/ota/devices/{deviceId}",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: {
            "application/json": { schema: TriggerOtaBody },
          },
        },
      },
      responses: {
        201: {
          content: { "application/json": { schema: TriggerOtaResponse } },
          description: "Trigger OTA to a device.",
        },
        404: { description: "Device or firmware release not found" },
        400: { description: "Bad request" },
      },
    }),
    async (c) => {
      try {
        const { deviceId } = c.req.valid("param");
        const body = c.req.valid("json");

        const result = await triggerDeviceOta({
          requestUrl: c.req.url,
          deviceId: Number(deviceId),
          releaseId: Number(body.releaseId),
        });

        return c.json({ data: result }, 201);
      } catch (e: any) {
        const msg = e?.message ?? "BAD_REQUEST";
        const code = msg.toLowerCase().includes("not found") ? 404 : 400;
        return c.json({ error: msg }, code);
      }
    },
  );

  // GET /api/v1/ota/devices/{deviceId}/jobs
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/ota/devices/{deviceId}/jobs",
      request: {
        params: z.object({ deviceId: DeviceId }),
        query: z.object({
          limit: z.coerce.number().int().min(1).max(200).optional(),
        }),
      },
      responses: {
        200: {
          content: { "application/json": { schema: OtaJobListResponse } },
          description: "List OTA jobs for a device.",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const q = c.req.valid("query");

      const data = await listDeviceJobs({
        deviceId: Number(deviceId),
        limit: q.limit,
      });

      return c.json({ data }, 200);
    },
  );

  // GET /api/v1/ota/jobs/{otaJobId}
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/ota/jobs/{otaJobId}",
      request: { params: z.object({ otaJobId: OtaJobId }) },
      responses: {
        200: {
          content: { "application/json": { schema: OtaJobResponse } },
          description: "Get OTA job detail.",
        },
        404: { description: "OTA job not found" },
      },
    }),
    async (c) => {
      try {
        const { otaJobId } = c.req.valid("param");
        const data = await getJob({ otaJobId: Number(otaJobId) });
        return c.json({ data }, 200);
      } catch (e: any) {
        return c.json({ error: e?.message ?? "NOT_FOUND" }, 404);
      }
    },
  );
}
