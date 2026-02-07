import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

import type { AppEnv } from "./types/app-env";
import { registerV1Routes } from "./routes/index";

export const app = new OpenAPIHono<AppEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "VALIDATION_ERROR", issues: result.error.issues },
        422,
      );
    }
  },
});

// Middlewares
app.use("*", logger());
app.use(
  "*",
  cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"] }),
);

// Landing page (Tailwind)
app.get("/", serveStatic({ path: "./public/index.html" }));
app.get("/styles.css", serveStatic({ path: "./public/styles.css" }));
app.get("/docs/asyncapi.yaml", serveStatic({ path: "./docs/asyncapi.yaml" }));

// OpenAPI (Swagger)
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Smart Home Backend API",
    version: "0.1.0",
    description: "Backend for IoT + AI Smart Home (Hono + Bun + Prisma).",
  },
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

// API v1 (registered directly on root app)
registerV1Routes(app);

// Simple health (not under /api)
app.get("/health", (c) => c.json({ ok: true }));
