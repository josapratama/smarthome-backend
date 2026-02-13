/*
  Warnings:

  - You are about to drop the `device_status` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnomalyMetric" ADD VALUE 'VOLTAGE';
ALTER TYPE "AnomalyMetric" ADD VALUE 'CURRENT';
ALTER TYPE "AnomalyMetric" ADD VALUE 'SENSOR_MALFUNCTION';

-- DropForeignKey
ALTER TABLE "alarm_event" DROP CONSTRAINT "alarm_event_device_id_fkey";

-- DropForeignKey
ALTER TABLE "command" DROP CONSTRAINT "command_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_config" DROP CONSTRAINT "device_config_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_event_log" DROP CONSTRAINT "device_event_log_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_pairing_history" DROP CONSTRAINT "device_pairing_history_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_state_history" DROP CONSTRAINT "device_state_history_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_status" DROP CONSTRAINT "device_status_home_id_fkey";

-- DropForeignKey
ALTER TABLE "device_status" DROP CONSTRAINT "device_status_room_id_fkey";

-- DropForeignKey
ALTER TABLE "device_status" DROP CONSTRAINT "device_status_user_id_fkey";

-- DropForeignKey
ALTER TABLE "energy_prediction" DROP CONSTRAINT "energy_prediction_device_id_fkey";

-- DropForeignKey
ALTER TABLE "energy_usage_daily" DROP CONSTRAINT "energy_usage_daily_device_id_fkey";

-- DropForeignKey
ALTER TABLE "ota_job" DROP CONSTRAINT "ota_job_device_id_fkey";

-- DropForeignKey
ALTER TABLE "sensor_data" DROP CONSTRAINT "sensor_data_device_id_fkey";

-- DropForeignKey
ALTER TABLE "sensor_reading" DROP CONSTRAINT "sensor_reading_device_id_fkey";

-- DropTable
DROP TABLE "device_status";

-- CreateTable
CREATE TABLE "device" (
    "id" SERIAL NOT NULL,
    "device_name" TEXT NOT NULL,
    "room_id" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),
    "mqtt_client_id" TEXT,
    "device_key" TEXT,
    "device_type" "DeviceType" NOT NULL DEFAULT 'OTHER',
    "capabilities" JSONB,
    "user_id" INTEGER NOT NULL,
    "home_id" INTEGER NOT NULL,
    "paired_at" TIMESTAMP(3),
    "unpaired_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "total_predictions" INTEGER NOT NULL DEFAULT 0,
    "avg_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ai_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_performance" (
    "id" SERIAL NOT NULL,
    "model_name" TEXT NOT NULL,
    "device_id" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "prediction_date" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_user_id_idx" ON "device"("user_id");

-- CreateIndex
CREATE INDEX "device_home_id_idx" ON "device"("home_id");

-- CreateIndex
CREATE INDEX "device_room_id_idx" ON "device"("room_id");

-- CreateIndex
CREATE INDEX "device_deleted_at_idx" ON "device"("deleted_at");

-- CreateIndex
CREATE INDEX "device_device_type_home_id_idx" ON "device"("device_type", "home_id");

-- CreateIndex
CREATE INDEX "device_status_last_seen_at_idx" ON "device"("status", "last_seen_at");

-- CreateIndex
CREATE INDEX "device_mqtt_client_id_idx" ON "device"("mqtt_client_id");

-- CreateIndex
CREATE INDEX "device_device_key_idx" ON "device"("device_key");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_name_key" ON "ai_model"("name");

-- CreateIndex
CREATE INDEX "ai_model_is_active_avg_accuracy_idx" ON "ai_model"("is_active", "avg_accuracy");

-- CreateIndex
CREATE INDEX "ai_model_algorithm_version_idx" ON "ai_model"("algorithm", "version");

-- CreateIndex
CREATE INDEX "ai_model_performance_model_name_device_id_recorded_at_idx" ON "ai_model_performance"("model_name", "device_id", "recorded_at");

-- CreateIndex
CREATE INDEX "ai_model_performance_accuracy_recorded_at_idx" ON "ai_model_performance"("accuracy", "recorded_at");

-- CreateIndex
CREATE INDEX "anomaly_result_is_anomaly_score_detected_at_idx" ON "anomaly_result"("is_anomaly", "score", "detected_at");

-- CreateIndex
CREATE INDEX "anomaly_result_metric_detected_at_idx" ON "anomaly_result"("metric", "detected_at");

-- CreateIndex
CREATE INDEX "command_source_status_created_at_idx" ON "command"("source", "status", "created_at");

-- CreateIndex
CREATE INDEX "command_correlation_id_idx" ON "command"("correlation_id");

-- CreateIndex
CREATE INDEX "energy_prediction_device_id_window_start_window_end_idx" ON "energy_prediction"("device_id", "window_start", "window_end");

-- CreateIndex
CREATE INDEX "energy_prediction_actual_energy_idx" ON "energy_prediction"("actual_energy");

-- CreateIndex
CREATE INDEX "energy_prediction_model_version_created_at_idx" ON "energy_prediction"("model_version", "created_at");

-- CreateIndex
CREATE INDEX "sensor_data_device_id_power_w_timestamp_idx" ON "sensor_data"("device_id", "power_w", "timestamp");

-- CreateIndex
CREATE INDEX "sensor_data_device_id_gas_ppm_timestamp_idx" ON "sensor_data"("device_id", "gas_ppm", "timestamp");

-- CreateIndex
CREATE INDEX "sensor_data_timestamp_idx" ON "sensor_data"("timestamp");

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_config" ADD CONSTRAINT "device_config_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pairing_history" ADD CONSTRAINT "device_pairing_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_state_history" ADD CONSTRAINT "device_state_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_reading" ADD CONSTRAINT "sensor_reading_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_prediction" ADD CONSTRAINT "energy_prediction_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command" ADD CONSTRAINT "command_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_usage_daily" ADD CONSTRAINT "energy_usage_daily_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_job" ADD CONSTRAINT "ota_job_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_event_log" ADD CONSTRAINT "device_event_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_performance" ADD CONSTRAINT "ai_model_performance_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
