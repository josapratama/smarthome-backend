import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { prisma } from "../lib/prisma";

// ---------- Helpers ----------
const toISO = (d: Date | null | undefined) => (d ? d.toISOString() : null);

const getClientIp = (c: any) => {
  const xf = c.req.header("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return c.req.header("x-real-ip") ?? null;
};

// ---------- Common Schemas ----------
const Email = z.string().email().openapi({ example: "user@example.com" });
const Username = z.string().min(3).openapi({ example: "temanakun" });

const UserId = z.coerce.number().int().openapi({ example: 1 });
const HomeId = z.coerce.number().int().openapi({ example: 1 });
const DeviceId = z.coerce.number().int().openapi({ example: 1 });
const SensorId = z.coerce.number().int().openapi({ example: 1 });
const CommandId = z.coerce.number().int().openapi({ example: 1 });
const PredictionId = z.coerce.number().int().openapi({ example: 1 });
const EndpointId = z.coerce.number().int().openapi({ example: 1 });

// ---------- Auth ----------
const RegisterBody = z
  .object({
    username: Username,
    email: Email,
    password: z.string().min(8).openapi({ example: "password-kuat-123" }),
    role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
    homeName: z.string().min(1).optional().openapi({ example: "Rumah Utama" }),
  })
  .openapi("RegisterBody");

const LoginBody = z
  .object({
    identifier: z.string().min(3).openapi({ example: "user@example.com" }),
    password: z.string().min(1).openapi({ example: "password-kuat-123" }),
  })
  .openapi("LoginBody");

const UserDTO = z
  .object({
    id: UserId,
    username: z.string(),
    email: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.string(),
  })
  .openapi("UserDTO");

// ---------- Homes ----------
const HomeCreateBody = z
  .object({
    name: z.string().min(1).openapi({ example: "Rumah Utama" }),
    ownerId: UserId,
  })
  .openapi("HomeCreateBody");

const HomeDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    ownerId: UserId,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("HomeDTO");

// ---------- Devices ----------
const DeviceCreateBody = z
  .object({
    deviceName: z.string().min(1).openapi({ example: "ESP32-LivingRoom" }),
    room: z.string().min(1).optional().openapi({ example: "Ruang Tamu" }),
    mqttClientId: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "esp32-livingroom-001" }),
    deviceKey: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "devkey-optional" }),
  })
  .openapi("DeviceCreateBody");

const DeviceDTO = z
  .object({
    id: DeviceId,
    deviceName: z.string(),
    room: z.string().nullable(),
    status: z.boolean(),
    updatedAt: z.string(),
    lastSeenAt: z.string().nullable(),
    mqttClientId: z.string().nullable(),
    userId: UserId,
    homeId: HomeId.nullable(),
  })
  .openapi("DeviceDTO");

const DeviceUpdateBody = z
  .object({
    deviceName: z.string().min(1).optional(),
    room: z.string().min(1).optional(),
    status: z.boolean().optional(),
    lastSeenAt: z.string().datetime().optional(),
    mqttClientId: z.string().min(1).optional(),
    deviceKey: z.string().min(1).optional(),
    homeId: HomeId.optional().nullable(),
  })
  .openapi("DeviceUpdateBody");

// ---------- Sensor Data (Telemetry) ----------
const SensorDataIngestBody = z
  .object({
    current: z.number().openapi({ example: 0.72 }),
    gasPpm: z.number().openapi({ example: 650 }),
    flame: z.boolean().openapi({ example: false }),
    binLevel: z.number().openapi({ example: 35.5 }),
    timestamp: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: "2026-02-06T12:00:00.000Z" }),
  })
  .openapi("SensorDataIngestBody");

const SensorDataDTO = z
  .object({
    id: SensorId,
    deviceId: DeviceId,
    current: z.number(),
    gasPpm: z.number(),
    flame: z.boolean(),
    binLevel: z.number(),
    timestamp: z.string(),
  })
  .openapi("SensorDataDTO");

// ---------- Commands ----------
const CommandCreateBody = z
  .object({
    type: z.string().min(1).openapi({ example: "relay_set" }),
    payload: z.record(z.any()).openapi({ example: { relay: 1, state: "ON" } }),
  })
  .openapi("CommandCreateBody");

const CommandDTO = z
  .object({
    id: CommandId,
    deviceId: DeviceId,
    type: z.string(),
    payload: z.any(),
    status: z.enum(["PENDING", "SENT", "ACKED", "FAILED", "TIMEOUT"]),
    ackedAt: z.string().nullable(),
    lastError: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CommandDTO");

// ---------- Alarm Events (Events) ----------
const AlarmCreateBody = z
  .object({
    deviceId: DeviceId,
    // kalau tidak dikirim, backend pakai sensor_data terbaru milik device
    sensorId: SensorId.optional(),
    type: z.string().min(1).openapi({ example: "gas_leak" }),
    message: z
      .string()
      .min(1)
      .openapi({ example: "Gas melebihi ambang batas" }),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.enum(["DEVICE", "BACKEND", "AI", "USER"]).default("BACKEND"),
    triggeredAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: "2026-02-06T12:00:05.000Z" }),
  })
  .openapi("AlarmCreateBody");

const AlarmDTO = z
  .object({
    id: z.coerce.number().int(),
    sensorId: SensorId,
    deviceId: DeviceId,
    homeId: HomeId.nullable(),
    type: z.string(),
    message: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.enum(["DEVICE", "BACKEND", "AI", "USER"]),
    triggeredAt: z.string(),
  })
  .openapi("AlarmDTO");

// ---------- AI ----------
const EnergyPredictionCreateBody = z
  .object({
    predictedEnergy: z.number().openapi({ example: 1.25 }),
    actualEnergy: z.number().optional().openapi({ example: 1.1 }),
    windowStart: z.string().datetime().optional(),
    windowEnd: z.string().datetime().optional(),
    modelVersion: z.string().min(1).optional().openapi({ example: "v1" }),
  })
  .openapi("EnergyPredictionCreateBody");

const EnergyPredictionDTO = z
  .object({
    id: PredictionId,
    deviceId: DeviceId,
    predictedEnergy: z.number(),
    actualEnergy: z.number().nullable(),
    windowStart: z.string().nullable(),
    windowEnd: z.string().nullable(),
    modelVersion: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("EnergyPredictionDTO");

const AnomalyCreateBody = z
  .object({
    isAnomaly: z.boolean(),
    score: z.number().openapi({ example: 0.87 }),
    metric: z.enum(["POWER", "GAS", "FLAME", "TRASH"]).optional(),
    details: z.record(z.any()).optional(),
    detectedAt: z.string().datetime().optional(),
  })
  .openapi("AnomalyCreateBody");

const AnomalyDTO = z
  .object({
    id: z.coerce.number().int(),
    predictionId: PredictionId,
    isAnomaly: z.boolean(),
    score: z.number(),
    metric: z.enum(["POWER", "GAS", "FLAME", "TRASH"]).nullable(),
    details: z.any().nullable(),
    detectedAt: z.string(),
  })
  .openapi("AnomalyDTO");

// ---------- Notifications (generic) ----------
const NotificationEndpointCreateBody = z
  .object({
    channel: z
      .enum(["FCM", "MQTT", "WS", "SSE", "WEBHOOK", "CUSTOM"])
      .default("CUSTOM"),
    value: z.string().min(3).openapi({
      example:
        "mqtt://clientId-or-topic / https://example.com/webhook / random-token",
    }),
  })
  .openapi("NotificationEndpointCreateBody");

const NotificationEndpointDTO = z
  .object({
    id: EndpointId,
    userId: UserId,
    channel: z.enum(["FCM", "MQTT", "WS", "SSE", "WEBHOOK", "CUSTOM"]),
    value: z.string(),
    createdAt: z.string(),
  })
  .openapi("NotificationEndpointDTO");

export function registerV1Routes(app: OpenAPIHono) {
  // ---------- AUTH ----------

  // POST /auth/register
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/register",
      request: {
        body: { content: { "application/json": { schema: RegisterBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({
                data: z.object({ user: UserDTO, home: HomeDTO.nullable() }),
              }),
            },
          },
          description: "Register user (optional: create first home).",
        },
        409: { description: "Username/email already exists" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");

      const passwordHash = await Bun.password.hash(body.password);

      const user = await prisma.userAccount
        .create({
          data: {
            username: body.username,
            email: body.email,
            passwordHash,
            role: body.role,
          },
        })
        .catch((e) => {
          // unique constraint
          if (String(e).toLowerCase().includes("unique")) return null;
          throw e;
        });
      if (!user) return c.json({ error: "ALREADY_EXISTS" }, 409);

      const home = body.homeName
        ? await prisma.home.create({
            data: { name: body.homeName, ownerId: user.id },
          })
        : null;

      return c.json(
        {
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              createdAt: user.createdAt.toISOString(),
            },
            home: home
              ? {
                  id: home.id,
                  name: home.name,
                  ownerId: home.ownerId,
                  createdAt: home.createdAt.toISOString(),
                  updatedAt: home.updatedAt.toISOString(),
                }
              : null,
          },
        },
        201,
      );
    },
  );

  // POST /auth/login
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/auth/login",
      request: {
        body: { content: { "application/json": { schema: LoginBody } } },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.object({ user: UserDTO }) }),
            },
          },
          description: "Login (writes login_history).",
        },
        401: { description: "Invalid credentials" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");

      const user = await prisma.userAccount.findFirst({
        where: {
          OR: [{ email: body.identifier }, { username: body.identifier }],
        },
      });
      if (!user) return c.json({ error: "INVALID_CREDENTIALS" }, 401);

      const ok = await Bun.password.verify(body.password, user.passwordHash);
      if (!ok) return c.json({ error: "INVALID_CREDENTIALS" }, 401);

      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: getClientIp(c),
        },
      });

      return c.json({
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
          },
        },
      });
    },
  );

  // ---------- HOMES ----------

  // GET /homes
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes",
      request: {
        query: z.object({
          ownerId: UserId.optional(),
          ownerEmail: Email.optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(HomeDTO) }),
            },
          },
          description: "List homes (filter by ownerId or ownerEmail).",
        },
      },
    }),
    async (c) => {
      const { ownerId, ownerEmail } = c.req.valid("query");

      const homes = await prisma.home.findMany({
        where:
          ownerId || ownerEmail
            ? {
                ownerId: ownerId ?? undefined,
                owner: ownerEmail ? { is: { email: ownerEmail } } : undefined,
              }
            : undefined,
        orderBy: { createdAt: "desc" },
      });

      return c.json({
        data: homes.map((h) => ({
          id: h.id,
          name: h.name,
          ownerId: h.ownerId,
          createdAt: h.createdAt.toISOString(),
          updatedAt: h.updatedAt.toISOString(),
        })),
      });
    },
  );

  // POST /homes
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/homes",
      request: {
        body: { content: { "application/json": { schema: HomeCreateBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: HomeDTO }) },
          },
          description: "Create a home for an existing user.",
        },
        404: { description: "Owner not found" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");

      const owner = await prisma.userAccount.findUnique({
        where: { id: body.ownerId },
      });
      if (!owner) return c.json({ error: "OWNER_NOT_FOUND" }, 404);

      const home = await prisma.home.create({
        data: { name: body.name, ownerId: body.ownerId },
      });

      return c.json(
        {
          data: {
            id: home.id,
            name: home.name,
            ownerId: home.ownerId,
            createdAt: home.createdAt.toISOString(),
            updatedAt: home.updatedAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  // GET /homes/{homeId}
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}",
      request: { params: z.object({ homeId: HomeId }) },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: HomeDTO }) },
          },
          description: "Get a home by ID.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const home = await prisma.home.findUnique({ where: { id: homeId } });
      if (!home) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({
        data: {
          id: home.id,
          name: home.name,
          ownerId: home.ownerId,
          createdAt: home.createdAt.toISOString(),
          updatedAt: home.updatedAt.toISOString(),
        },
      });
    },
  );

  // ---------- DEVICES ----------

  // GET /homes/{homeId}/devices
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}/devices",
      request: { params: z.object({ homeId: HomeId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(DeviceDTO) }),
            },
          },
          description: "List devices for a home.",
        },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const devices = await prisma.device.findMany({
        where: { homeId },
        orderBy: { updatedAt: "desc" },
      });
      return c.json({
        data: devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          room: d.room ?? null,
          status: d.status,
          updatedAt: d.updatedAt.toISOString(),
          lastSeenAt: toISO(d.lastSeenAt),
          mqttClientId: d.mqttClientId ?? null,
          userId: d.userId,
          homeId: d.homeId ?? null,
        })),
      });
    },
  );

  // POST /homes/{homeId}/devices
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/homes/{homeId}/devices",
      request: {
        params: z.object({ homeId: HomeId }),
        body: { content: { "application/json": { schema: DeviceCreateBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description:
            "Create device under a home (userId inferred from home owner).",
        },
        404: { description: "Home not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const body = c.req.valid("json");

      const home = await prisma.home.findUnique({ where: { id: homeId } });
      if (!home) return c.json({ error: "HOME_NOT_FOUND" }, 404);

      const device = await prisma.device.create({
        data: {
          homeId: home.id,
          userId: home.ownerId,
          deviceName: body.deviceName,
          room: body.room,
          mqttClientId: body.mqttClientId,
          deviceKey: body.deviceKey,
          status: false,
        },
      });

      return c.json(
        {
          data: {
            id: device.id,
            deviceName: device.deviceName,
            room: device.room ?? null,
            status: device.status,
            updatedAt: device.updatedAt.toISOString(),
            lastSeenAt: toISO(device.lastSeenAt),
            mqttClientId: device.mqttClientId ?? null,
            userId: device.userId,
            homeId: device.homeId ?? null,
          },
        },
        201,
      );
    },
  );

  // GET /devices/{deviceId}
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}",
      request: { params: z.object({ deviceId: DeviceId }) },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description: "Get device details.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const d = await prisma.device.findUnique({ where: { id: deviceId } });
      if (!d) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({
        data: {
          id: d.id,
          deviceName: d.deviceName,
          room: d.room ?? null,
          status: d.status,
          updatedAt: d.updatedAt.toISOString(),
          lastSeenAt: toISO(d.lastSeenAt),
          mqttClientId: d.mqttClientId ?? null,
          userId: d.userId,
          homeId: d.homeId ?? null,
        },
      });
    },
  );

  // PATCH /devices/{deviceId}
  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/devices/{deviceId}",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: { content: { "application/json": { schema: DeviceUpdateBody } } },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: DeviceDTO }) },
          },
          description: "Update device (name/room/status/lastSeenAt/keys).",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const d = await prisma.device
        .update({
          where: { id: deviceId },
          data: {
            deviceName: body.deviceName,
            room: body.room,
            status: body.status,
            lastSeenAt: body.lastSeenAt ? new Date(body.lastSeenAt) : undefined,
            mqttClientId: body.mqttClientId,
            deviceKey: body.deviceKey,
            homeId: body.homeId,
          },
        })
        .catch(() => null);

      if (!d) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({
        data: {
          id: d.id,
          deviceName: d.deviceName,
          room: d.room ?? null,
          status: d.status,
          updatedAt: d.updatedAt.toISOString(),
          lastSeenAt: toISO(d.lastSeenAt),
          mqttClientId: d.mqttClientId ?? null,
          userId: d.userId,
          homeId: d.homeId ?? null,
        },
      });
    },
  );

  // ---------- SENSOR DATA (TELEMETRY) ----------

  // POST /devices/{deviceId}/telemetry
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/telemetry",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: { "application/json": { schema: SensorDataIngestBody } },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: SensorDataDTO }) },
          },
          description:
            "Ingest sensor snapshot (HTTP). MQTT devices biasanya masuk lewat consumer yang nanti kita buat.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const device = await prisma.device
        .update({
          where: { id: deviceId },
          data: { status: true, lastSeenAt: new Date() },
        })
        .catch(() => null);
      if (!device) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

      const row = await prisma.sensorData.create({
        data: {
          deviceId,
          current: body.current,
          gasPpm: body.gasPpm,
          flame: body.flame,
          binLevel: body.binLevel,
          timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        },
      });

      return c.json(
        {
          data: {
            id: row.id,
            deviceId: row.deviceId,
            current: row.current,
            gasPpm: row.gasPpm,
            flame: row.flame,
            binLevel: row.binLevel,
            timestamp: row.timestamp.toISOString(),
          },
        },
        201,
      );
    },
  );

  // GET /devices/{deviceId}/telemetry/latest
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/telemetry/latest",
      request: { params: z.object({ deviceId: DeviceId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: SensorDataDTO.nullable() }),
            },
          },
          description: "Get latest sensor snapshot.",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const row = await prisma.sensorData.findFirst({
        where: { deviceId },
        orderBy: { timestamp: "desc" },
      });
      if (!row) return c.json({ data: null });
      return c.json({
        data: {
          id: row.id,
          deviceId: row.deviceId,
          current: row.current,
          gasPpm: row.gasPpm,
          flame: row.flame,
          binLevel: row.binLevel,
          timestamp: row.timestamp.toISOString(),
        },
      });
    },
  );

  // GET /devices/{deviceId}/telemetry
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/telemetry",
      request: {
        params: z.object({ deviceId: DeviceId }),
        query: z.object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          limit: z.coerce.number().int().min(1).max(5000).default(500),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(SensorDataDTO) }),
            },
          },
          description: "Query telemetry history (sensor_data snapshots).",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const { from, to, limit } = c.req.valid("query");

      const rows = await prisma.sensorData.findMany({
        where: {
          deviceId,
          timestamp: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return c.json({
        data: rows.map((r) => ({
          id: r.id,
          deviceId: r.deviceId,
          current: r.current,
          gasPpm: r.gasPpm,
          flame: r.flame,
          binLevel: r.binLevel,
          timestamp: r.timestamp.toISOString(),
        })),
      });
    },
  );

  // ---------- COMMANDS ----------

  // POST /devices/{deviceId}/commands
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/commands",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: { "application/json": { schema: CommandCreateBody } },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: CommandDTO }) },
          },
          description:
            "Create a command record. Nanti kita sambungkan ke MQTT publisher + ack handler supaya status berubah SENT/ACKED.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const device = await prisma.device.findUnique({
        where: { id: deviceId },
      });
      if (!device) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

      const cmd = await prisma.command.create({
        data: {
          deviceId,
          type: body.type,
          payload: body.payload,
          status: "PENDING",
        },
      });

      return c.json(
        {
          data: {
            id: cmd.id,
            deviceId: cmd.deviceId,
            type: cmd.type,
            payload: cmd.payload,
            status: cmd.status,
            ackedAt: toISO(cmd.ackedAt),
            lastError: cmd.lastError ?? null,
            createdAt: cmd.createdAt.toISOString(),
            updatedAt: cmd.updatedAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  // GET /commands/{commandId}
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/commands/{commandId}",
      request: { params: z.object({ commandId: CommandId }) },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: CommandDTO }) },
          },
          description: "Get command status.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { commandId } = c.req.valid("param");
      const cmd = await prisma.command.findUnique({ where: { id: commandId } });
      if (!cmd) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({
        data: {
          id: cmd.id,
          deviceId: cmd.deviceId,
          type: cmd.type,
          payload: cmd.payload,
          status: cmd.status,
          ackedAt: toISO(cmd.ackedAt),
          lastError: cmd.lastError ?? null,
          createdAt: cmd.createdAt.toISOString(),
          updatedAt: cmd.updatedAt.toISOString(),
        },
      });
    },
  );

  // ---------- EVENTS (ALARM_EVENT) ----------

  // GET /homes/{homeId}/events
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}/events",
      request: {
        params: z.object({ homeId: HomeId }),
        query: z.object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          limit: z.coerce.number().int().min(1).max(5000).default(200),
        }),
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

      const events = await prisma.alarmEvent.findMany({
        where: {
          homeId,
          triggeredAt: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
        orderBy: { triggeredAt: "desc" },
        take: limit,
      });

      return c.json({
        data: events.map((e) => ({
          id: e.id,
          sensorId: e.sensorId,
          deviceId: e.deviceId,
          homeId: e.homeId ?? null,
          type: e.type,
          message: e.message,
          severity: e.severity,
          source: e.source,
          triggeredAt: e.triggeredAt.toISOString(),
        })),
      });
    },
  );

  // POST /homes/{homeId}/events
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
          description:
            "Create alarm_event. Jika sensorId tidak dikirim, pakai sensor_data terbaru untuk deviceId.",
        },
        400: { description: "Device not in home / no sensor data" },
        404: { description: "Home/Device not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const body = c.req.valid("json");

      const home = await prisma.home.findUnique({ where: { id: homeId } });
      if (!home) return c.json({ error: "HOME_NOT_FOUND" }, 404);

      const device = await prisma.device.findUnique({
        where: { id: body.deviceId },
      });
      if (!device) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);
      if (device.homeId !== homeId)
        return c.json({ error: "DEVICE_NOT_IN_HOME" }, 400);

      let sensorId = body.sensorId;
      if (!sensorId) {
        const latest = await prisma.sensorData.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: "desc" },
        });
        if (!latest) return c.json({ error: "NO_SENSOR_DATA" }, 400);
        sensorId = latest.id;
      }

      const alarm = await prisma.alarmEvent.create({
        data: {
          sensorId,
          deviceId: device.id,
          homeId,
          type: body.type,
          message: body.message,
          severity: body.severity,
          source: body.source,
          triggeredAt: body.triggeredAt
            ? new Date(body.triggeredAt)
            : new Date(),
        },
      });

      return c.json(
        {
          data: {
            id: alarm.id,
            sensorId: alarm.sensorId,
            deviceId: alarm.deviceId,
            homeId: alarm.homeId ?? null,
            type: alarm.type,
            message: alarm.message,
            severity: alarm.severity,
            source: alarm.source,
            triggeredAt: alarm.triggeredAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  // ---------- AI (minimal CRUD) ----------

  // POST /devices/{deviceId}/energy-predictions
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/devices/{deviceId}/energy-predictions",
      request: {
        params: z.object({ deviceId: DeviceId }),
        body: {
          content: {
            "application/json": { schema: EnergyPredictionCreateBody },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({ data: EnergyPredictionDTO }),
            },
          },
          description: "Create energy prediction record.",
        },
        404: { description: "Device not found" },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const body = c.req.valid("json");

      const device = await prisma.device.findUnique({
        where: { id: deviceId },
      });
      if (!device) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

      const p = await prisma.energyPrediction.create({
        data: {
          deviceId,
          predictedEnergy: body.predictedEnergy,
          actualEnergy: body.actualEnergy,
          windowStart: body.windowStart
            ? new Date(body.windowStart)
            : undefined,
          windowEnd: body.windowEnd ? new Date(body.windowEnd) : undefined,
          modelVersion: body.modelVersion,
        },
      });

      return c.json(
        {
          data: {
            id: p.id,
            deviceId: p.deviceId,
            predictedEnergy: p.predictedEnergy,
            actualEnergy: p.actualEnergy ?? null,
            windowStart: toISO(p.windowStart),
            windowEnd: toISO(p.windowEnd),
            modelVersion: p.modelVersion ?? null,
            createdAt: p.createdAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  // GET /devices/{deviceId}/energy-predictions
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/devices/{deviceId}/energy-predictions",
      request: {
        params: z.object({ deviceId: DeviceId }),
        query: z.object({
          limit: z.coerce.number().int().min(1).max(5000).default(200),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(EnergyPredictionDTO) }),
            },
          },
          description: "List energy predictions for a device.",
        },
      },
    }),
    async (c) => {
      const { deviceId } = c.req.valid("param");
      const { limit } = c.req.valid("query");

      const rows = await prisma.energyPrediction.findMany({
        where: { deviceId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return c.json({
        data: rows.map((p) => ({
          id: p.id,
          deviceId: p.deviceId,
          predictedEnergy: p.predictedEnergy,
          actualEnergy: p.actualEnergy ?? null,
          windowStart: toISO(p.windowStart),
          windowEnd: toISO(p.windowEnd),
          modelVersion: p.modelVersion ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
      });
    },
  );

  // POST /predictions/{predictionId}/anomalies
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/predictions/{predictionId}/anomalies",
      request: {
        params: z.object({ predictionId: PredictionId }),
        body: {
          content: { "application/json": { schema: AnomalyCreateBody } },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: AnomalyDTO }) },
          },
          description: "Create anomaly result for a prediction.",
        },
        404: { description: "Prediction not found" },
      },
    }),
    async (c) => {
      const { predictionId } = c.req.valid("param");
      const body = c.req.valid("json");

      const pred = await prisma.energyPrediction.findUnique({
        where: { id: predictionId },
      });
      if (!pred) return c.json({ error: "PREDICTION_NOT_FOUND" }, 404);

      const row = await prisma.anomalyResult.create({
        data: {
          predictionId,
          isAnomaly: body.isAnomaly,
          score: body.score,
          metric: body.metric,
          details: body.details,
          detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
        },
      });

      return c.json(
        {
          data: {
            id: row.id,
            predictionId: row.predictionId,
            isAnomaly: row.isAnomaly,
            score: row.score,
            metric: (row.metric as any) ?? null,
            details: (row.details as any) ?? null,
            detectedAt: row.detectedAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  // GET /predictions/{predictionId}/anomalies
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/predictions/{predictionId}/anomalies",
      request: {
        params: z.object({ predictionId: PredictionId }),
        query: z.object({
          limit: z.coerce.number().int().min(1).max(5000).default(200),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(AnomalyDTO) }),
            },
          },
          description: "List anomaly results for a prediction.",
        },
      },
    }),
    async (c) => {
      const { predictionId } = c.req.valid("param");
      const { limit } = c.req.valid("query");

      const rows = await prisma.anomalyResult.findMany({
        where: { predictionId },
        orderBy: { detectedAt: "desc" },
        take: limit,
      });

      return c.json({
        data: rows.map((r) => ({
          id: r.id,
          predictionId: r.predictionId,
          isAnomaly: r.isAnomaly,
          score: r.score,
          metric: (r.metric as any) ?? null,
          details: (r.details as any) ?? null,
          detectedAt: r.detectedAt.toISOString(),
        })),
      });
    },
  );

  // ---------- NOTIFICATION ENDPOINTS (generic) ----------

  // GET /users/{userId}/notification-endpoints
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/users/{userId}/notification-endpoints",
      request: { params: z.object({ userId: UserId }) },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(NotificationEndpointDTO) }),
            },
          },
          description: "List notification endpoints for a user.",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("param");
      const rows = await prisma.notificationEndpoint.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return c.json({
        data: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          channel: r.channel,
          value: r.value,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    },
  );

  // POST /users/{userId}/notification-endpoints
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/users/{userId}/notification-endpoints",
      request: {
        params: z.object({ userId: UserId }),
        body: {
          content: {
            "application/json": { schema: NotificationEndpointCreateBody },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({ data: NotificationEndpointDTO }),
            },
          },
          description:
            "Create a notification endpoint (FCM/MQTT/WS/SSE/WEBHOOK/etc).",
        },
        404: { description: "User not found" },
        409: { description: "Endpoint value already exists" },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("param");
      const body = c.req.valid("json");

      const user = await prisma.userAccount.findUnique({
        where: { id: userId },
      });
      if (!user) return c.json({ error: "USER_NOT_FOUND" }, 404);

      const row = await prisma.notificationEndpoint
        .create({
          data: { userId, channel: body.channel, value: body.value },
        })
        .catch((e) => {
          if (String(e).toLowerCase().includes("unique")) return null;
          throw e;
        });
      if (!row) return c.json({ error: "ALREADY_EXISTS" }, 409);

      return c.json(
        {
          data: {
            id: row.id,
            userId: row.userId,
            channel: row.channel,
            value: row.value,
            createdAt: row.createdAt.toISOString(),
          },
        },
        201,
      );
    },
  );
}
