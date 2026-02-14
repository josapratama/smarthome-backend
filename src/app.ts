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
  cors({
    origin: (origin) => {
      // Allow requests from frontend dev server and production
      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000",
      ];

      // Allow if origin is in allowed list or if no origin (same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || "*";
      }

      return allowedOrigins[0]; // Default to localhost:3001
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // Important: Allow credentials (cookies)
    exposeHeaders: ["Content-Length", "X-Request-Id"],
  }),
);

// Landing page (Tailwind)
app.get("/", serveStatic({ path: "./public/index.html" }));
app.get("/styles.css", serveStatic({ path: "./public/styles.css" }));
app.get("/docs/asyncapi.yaml", serveStatic({ path: "./docs/asyncapi.yaml" }));

// Documentation files
app.get(
  "/docs/:filename",
  serveStatic({
    root: "./docs/",
    rewriteRequestPath: (path) => path.replace(/^\/docs\//, ""),
  }),
);

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
