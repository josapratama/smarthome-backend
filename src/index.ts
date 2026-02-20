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

// AI Workers
import {
  startAIPredictionUpdateWorker,
  startDailyPredictionWorker,
} from "./workers/ai-prediction-update.worker";

startCommandTimeoutWorker();
startDeviceOfflineWorker();
startOtaTimeoutWorker();

startSessionExpiryWorker();
startInviteTokenExpiryWorker();
startPasswordResetCleanupWorker();
startNotificationPendingTimeoutWorker();

// Start AI workers
startAIPredictionUpdateWorker(30); // Update predictions every 30 minutes
startDailyPredictionWorker(); // Generate daily predictions at midnight

initMqttBridge();
startOtaProgressSubscriber();

const server = Bun.serve({
  port: env.PORT,
  hostname: "0.0.0.0", // Listen on all network interfaces
  fetch: app.fetch,
});

console.log(`✅ API running on http://0.0.0.0:${server.port}`);
console.log(`📚 Swagger UI at       http://localhost:${server.port}/docs`);
console.log(
  `🧾 OpenAPI JSON at      http://localhost:${server.port}/openapi.json`,
);
console.log(
  `🌐 Accessible from network at http://192.168.100.11:${server.port}`,
);
