/*
  Warnings:

  - You are about to drop the column `sensor_id` on the `alarm_event` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `device_status` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `home` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[correlation_id]` on the table `command` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[platform,version]` on the table `firmware_release` will be added. If there are existing duplicate values, this will fail.
  - Made the column `home_id` on table `alarm_event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `correlation_id` to the `command` table without a default value. This is not possible if the table is not empty.
  - Made the column `home_id` on table `device_status` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `owner_user_id` to the `home` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlarmStatus" AS ENUM ('OPEN', 'ACKED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('LIGHT', 'FAN', 'BELL', 'DOOR', 'SENSOR_NODE', 'POWER_METER', 'OTHER');

-- CreateEnum
CREATE TYPE "HomeMemberRole" AS ENUM ('OWNER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "HomeMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "PairingMethod" AS ENUM ('DEVICE_KEY', 'QR_CODE', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceEventSeverity" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "CommandSource" AS ENUM ('USER', 'BACKEND', 'AI', 'ADMIN');

-- DropForeignKey
ALTER TABLE "alarm_event" DROP CONSTRAINT "alarm_event_home_id_fkey";

-- DropForeignKey
ALTER TABLE "alarm_event" DROP CONSTRAINT "alarm_event_sensor_id_fkey";

-- DropForeignKey
ALTER TABLE "device_status" DROP CONSTRAINT "device_status_home_id_fkey";

-- DropForeignKey
ALTER TABLE "home" DROP CONSTRAINT "home_user_id_fkey";

-- DropIndex
DROP INDEX "firmware_release_platform_version_idx";

-- DropIndex
DROP INDEX "home_user_id_idx";

-- AlterTable
ALTER TABLE "alarm_event" DROP COLUMN "sensor_id",
ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "acknowledged_by" INTEGER,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by" INTEGER,
ADD COLUMN     "sensor_data_id" INTEGER,
ADD COLUMN     "sensor_reading_id" INTEGER,
ADD COLUMN     "status" "AlarmStatus" NOT NULL DEFAULT 'OPEN',
ALTER COLUMN "home_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "command" ADD COLUMN     "correlation_id" UUID NOT NULL,
ADD COLUMN     "requested_by" INTEGER,
ADD COLUMN     "source" "CommandSource" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "device_status" DROP COLUMN "room",
ADD COLUMN     "capabilities" JSONB,
ADD COLUMN     "device_type" "DeviceType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "paired_at" TIMESTAMP(3),
ADD COLUMN     "room_id" INTEGER,
ADD COLUMN     "unpaired_at" TIMESTAMP(3),
ALTER COLUMN "home_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "home" DROP COLUMN "user_id",
ADD COLUMN     "address_text" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "owner_user_id" INTEGER NOT NULL,
ADD COLUMN     "postal_code" TEXT;

-- AlterTable
ALTER TABLE "sensor_data" ADD COLUMN     "energy_kwh" DOUBLE PRECISION,
ADD COLUMN     "power_w" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_account" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "password_changed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "login_attempt" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "username_input" TEXT,
    "attempt_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "is_success" BOOLEAN NOT NULL,
    "fail_reason" TEXT,

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_member" (
    "id" SERIAL NOT NULL,
    "home_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_in_home" "HomeMemberRole" NOT NULL,
    "status" "HomeMemberStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "home_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" SERIAL NOT NULL,
    "home_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_config" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_pairing_history" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "home_id" INTEGER,
    "method" "PairingMethod",
    "paired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unpaired_at" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "device_pairing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_state_history" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "event_type" TEXT,
    "state" JSONB NOT NULL,
    "source" "AlarmSource" NOT NULL,
    "command_id" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_reading" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "value_num" DOUBLE PRECISION,
    "value_bool" BOOLEAN,
    "unit" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" SERIAL NOT NULL,
    "alarm_id" INTEGER NOT NULL,
    "endpoint_id" INTEGER NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "provider_response" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_usage_daily" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "home_id" INTEGER,
    "usage_date" DATE NOT NULL,
    "energy_kwh" DOUBLE PRECISION NOT NULL,
    "avg_power_w" DOUBLE PRECISION,
    "peak_power_w" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_event_log" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "home_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "severity" "DeviceEventSeverity" NOT NULL DEFAULT 'INFO',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempt_user_id_attempt_time_idx" ON "login_attempt"("user_id", "attempt_time");

-- CreateIndex
CREATE INDEX "login_attempt_ip_address_attempt_time_idx" ON "login_attempt"("ip_address", "attempt_time");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_refresh_token_hash_key" ON "user_session"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_session_user_id_expires_at_idx" ON "user_session"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "home_member_home_id_idx" ON "home_member"("home_id");

-- CreateIndex
CREATE INDEX "home_member_user_id_idx" ON "home_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_member_home_id_user_id_key" ON "home_member"("home_id", "user_id");

-- CreateIndex
CREATE INDEX "room_home_id_idx" ON "room"("home_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_home_id_name_key" ON "room"("home_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "device_config_device_id_key" ON "device_config"("device_id");

-- CreateIndex
CREATE INDEX "device_config_updated_by_updated_at_idx" ON "device_config"("updated_by", "updated_at");

-- CreateIndex
CREATE INDEX "device_pairing_history_device_id_paired_at_idx" ON "device_pairing_history"("device_id", "paired_at");

-- CreateIndex
CREATE INDEX "device_pairing_history_user_id_paired_at_idx" ON "device_pairing_history"("user_id", "paired_at");

-- CreateIndex
CREATE INDEX "device_pairing_history_home_id_paired_at_idx" ON "device_pairing_history"("home_id", "paired_at");

-- CreateIndex
CREATE INDEX "device_state_history_device_id_recorded_at_idx" ON "device_state_history"("device_id", "recorded_at");

-- CreateIndex
CREATE INDEX "device_state_history_command_id_idx" ON "device_state_history"("command_id");

-- CreateIndex
CREATE INDEX "sensor_reading_device_id_metric_timestamp_idx" ON "sensor_reading"("device_id", "metric", "timestamp");

-- CreateIndex
CREATE INDEX "notification_log_alarm_id_created_at_idx" ON "notification_log"("alarm_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_log_endpoint_id_created_at_idx" ON "notification_log"("endpoint_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_log_status_created_at_idx" ON "notification_log"("status", "created_at");

-- CreateIndex
CREATE INDEX "energy_usage_daily_home_id_usage_date_idx" ON "energy_usage_daily"("home_id", "usage_date");

-- CreateIndex
CREATE UNIQUE INDEX "energy_usage_daily_device_id_usage_date_key" ON "energy_usage_daily"("device_id", "usage_date");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_key" ON "password_reset"("token");

-- CreateIndex
CREATE INDEX "password_reset_user_id_created_at_idx" ON "password_reset"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "device_event_log_device_id_recorded_at_idx" ON "device_event_log"("device_id", "recorded_at");

-- CreateIndex
CREATE INDEX "device_event_log_home_id_recorded_at_idx" ON "device_event_log"("home_id", "recorded_at");

-- CreateIndex
CREATE INDEX "device_event_log_event_type_recorded_at_idx" ON "device_event_log"("event_type", "recorded_at");

-- CreateIndex
CREATE INDEX "alarm_event_status_triggered_at_idx" ON "alarm_event"("status", "triggered_at");

-- CreateIndex
CREATE INDEX "alarm_event_acknowledged_by_acknowledged_at_idx" ON "alarm_event"("acknowledged_by", "acknowledged_at");

-- CreateIndex
CREATE INDEX "alarm_event_resolved_by_resolved_at_idx" ON "alarm_event"("resolved_by", "resolved_at");

-- CreateIndex
CREATE INDEX "alarm_event_sensor_data_id_triggered_at_idx" ON "alarm_event"("sensor_data_id", "triggered_at");

-- CreateIndex
CREATE INDEX "alarm_event_sensor_reading_id_triggered_at_idx" ON "alarm_event"("sensor_reading_id", "triggered_at");

-- CreateIndex
CREATE UNIQUE INDEX "command_correlation_id_key" ON "command"("correlation_id");

-- CreateIndex
CREATE INDEX "command_requested_by_created_at_idx" ON "command"("requested_by", "created_at");

-- CreateIndex
CREATE INDEX "device_status_room_id_idx" ON "device_status"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "firmware_release_platform_version_key" ON "firmware_release"("platform", "version");

-- CreateIndex
CREATE INDEX "home_owner_user_id_idx" ON "home"("owner_user_id");

-- AddForeignKey
ALTER TABLE "login_attempt" ADD CONSTRAINT "login_attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home" ADD CONSTRAINT "home_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_config" ADD CONSTRAINT "device_config_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_config" ADD CONSTRAINT "device_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pairing_history" ADD CONSTRAINT "device_pairing_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pairing_history" ADD CONSTRAINT "device_pairing_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pairing_history" ADD CONSTRAINT "device_pairing_history_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_state_history" ADD CONSTRAINT "device_state_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_state_history" ADD CONSTRAINT "device_state_history_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "command"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_reading" ADD CONSTRAINT "sensor_reading_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_sensor_data_id_fkey" FOREIGN KEY ("sensor_data_id") REFERENCES "sensor_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_sensor_reading_id_fkey" FOREIGN KEY ("sensor_reading_id") REFERENCES "sensor_reading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_event" ADD CONSTRAINT "alarm_event_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command" ADD CONSTRAINT "command_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_alarm_id_fkey" FOREIGN KEY ("alarm_id") REFERENCES "alarm_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "notification_endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_usage_daily" ADD CONSTRAINT "energy_usage_daily_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_usage_daily" ADD CONSTRAINT "energy_usage_daily_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_event_log" ADD CONSTRAINT "device_event_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_event_log" ADD CONSTRAINT "device_event_log_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
