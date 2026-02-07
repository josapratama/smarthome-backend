-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('PENDING', 'SENT', 'ACKED', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "AlarmSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlarmSource" AS ENUM ('DEVICE', 'BACKEND', 'AI', 'USER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('FCM', 'MQTT', 'WS', 'SSE', 'WEBHOOK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AnomalyMetric" AS ENUM ('POWER', 'GAS', 'FLAME', 'TRASH');

-- CreateTable
CREATE TABLE "user_account" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_status" (
    "id" SERIAL NOT NULL,
    "device_name" TEXT NOT NULL,
    "room" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),
    "mqtt_client_id" TEXT,
    "device_key" TEXT,
    "user_id" INTEGER NOT NULL,
    "home_id" INTEGER,

    CONSTRAINT "device_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_data" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "gas_ppm" DOUBLE PRECISION NOT NULL,
    "flame" BOOLEAN NOT NULL,
    "bin_level" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alarm_event" (
    "id" SERIAL NOT NULL,
    "sensor_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "home_id" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlarmSeverity" NOT NULL,
    "source" "AlarmSource" NOT NULL DEFAULT 'DEVICE',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alarm_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_prediction" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "predicted_energy" DOUBLE PRECISION NOT NULL,
    "actual_energy" DOUBLE PRECISION,
    "window_start" TIMESTAMP(3),
    "window_end" TIMESTAMP(3),
    "model_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_result" (
    "id" SERIAL NOT NULL,
    "prediction_id" INTEGER NOT NULL,
    "is_anomaly" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metric" "AnomalyMetric",
    "details" JSONB,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "command" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "CommandStatus" NOT NULL DEFAULT 'PENDING',
    "acked_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "command_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_endpoint" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'CUSTOM',
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_username_key" ON "user_account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE INDEX "login_history_user_id_login_time_idx" ON "login_history"("user_id", "login_time");

-- CreateIndex
CREATE INDEX "home_user_id_idx" ON "home"("user_id");

-- CreateIndex
CREATE INDEX "device_status_user_id_idx" ON "device_status"("user_id");

-- CreateIndex
CREATE INDEX "device_status_home_id_idx" ON "device_status"("home_id");

-- CreateIndex
CREATE INDEX "sensor_data_device_id_timestamp_idx" ON "sensor_data"("device_id", "timestamp");

-- CreateIndex
CREATE INDEX "alarm_event_device_id_triggered_at_idx" ON "alarm_event"("device_id", "triggered_at");

-- CreateIndex
CREATE INDEX "alarm_event_home_id_triggered_at_idx" ON "alarm_event"("home_id", "triggered_at");

-- CreateIndex
CREATE INDEX "energy_prediction_device_id_created_at_idx" ON "energy_prediction"("device_id", "created_at");

-- CreateIndex
CREATE INDEX "anomaly_result_prediction_id_detected_at_idx" ON "anomaly_result"("prediction_id", "detected_at");

-- CreateIndex
CREATE INDEX "command_device_id_status_created_at_idx" ON "command"("device_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_endpoint_value_key" ON "notification_endpoint"("value");

-- CreateIndex
CREATE INDEX "notification_endpoint_user_id_idx" ON "notification_endpoint"("user_id");

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home" ADD CONSTRAINT "home_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_prediction" ADD CONSTRAINT "energy_prediction_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly_result" ADD CONSTRAINT "anomaly_result_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "energy_prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command" ADD CONSTRAINT "command_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_endpoint" ADD CONSTRAINT "notification_endpoint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
