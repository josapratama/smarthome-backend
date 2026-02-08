import { app } from "./app";
import { env } from "./lib/env";
import { initMqttBridge } from "./mqtt";
import { startCommandTimeoutWorker } from "./workers/command-timeout.worker";
import { startDeviceOfflineWorker } from "./workers/device-offline.worker";
import { startOtaProgressSubscriber } from "./mqtt/ota";
import { startOtaTimeoutWorker } from "./workers/ota-timeout.worker";

initMqttBridge();
startCommandTimeoutWorker();
startDeviceOfflineWorker();
startOtaProgressSubscriber();
startOtaTimeoutWorker();

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`✅ API running on http://localhost:${server.port}`);
console.log(`📚 Swagger UI at       http://localhost:${server.port}/docs`);
console.log(
  `🧾 OpenAPI JSON at      http://localhost:${server.port}/openapi.json`,
);
