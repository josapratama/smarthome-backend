import { app } from "./app";
import { env } from "./lib/env";
import { initMqttBridge } from "./mqtt";
import { startOtaProgressSubscriber } from "./mqtt/ota";
import { startCommandTimeoutWorker } from "./workers/command-timeout.worker";
import { startDeviceOfflineWorker } from "./workers/device-offline.worker";
import { startOtaTimeoutWorker } from "./workers/ota-timeout.worker";

import { startSessionExpiryWorker } from "./workers/session-expiry.worker";
import { startInviteTokenExpiryWorker } from "./workers/invite-token-expiry.worker";
import { startPasswordResetCleanupWorker } from "./workers/password-reset-cleanup.worker";
import { startNotificationPendingTimeoutWorker } from "./workers/notification-pending-timeout.worker";

startCommandTimeoutWorker();
startDeviceOfflineWorker();
startOtaTimeoutWorker();

startSessionExpiryWorker();
startInviteTokenExpiryWorker();
startPasswordResetCleanupWorker();
startNotificationPendingTimeoutWorker();

initMqttBridge();
startOtaProgressSubscriber();

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`✅ API running on http://localhost:${server.port}`);
console.log(`📚 Swagger UI at       http://localhost:${server.port}/docs`);
console.log(
  `🧾 OpenAPI JSON at      http://localhost:${server.port}/openapi.json`,
);
