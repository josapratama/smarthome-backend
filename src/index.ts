import { app } from "./app";
import { env } from "./lib/env";
import { initMqttBridge } from "./mqtt";
import { startCommandTimeoutWorker } from "./workers/command-timeout.worker";

initMqttBridge();

startCommandTimeoutWorker();

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`✅ API running on http://localhost:${server.port}`);
console.log(`📚 Swagger UI at       http://localhost:${server.port}/docs`);
console.log(
  `🧾 OpenAPI JSON at      http://localhost:${server.port}/openapi.json`,
);
