/*
  Warnings:

  - A unique constraint covering the columns `[mqtt_client_id]` on the table `device_status` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[device_key]` on the table `device_status` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OtaJobStatus" AS ENUM ('PENDING', 'SENT', 'DOWNLOADING', 'APPLIED', 'FAILED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "firmware_release" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firmware_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ota_job" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "release_id" INTEGER NOT NULL,
    "status" "OtaJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "downloading_at" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "command_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ota_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "firmware_release_sha256_key" ON "firmware_release"("sha256");

-- CreateIndex
CREATE INDEX "firmware_release_platform_version_idx" ON "firmware_release"("platform", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ota_job_command_id_key" ON "ota_job"("command_id");

-- CreateIndex
CREATE INDEX "ota_job_device_id_status_created_at_idx" ON "ota_job"("device_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ota_job_release_id_created_at_idx" ON "ota_job"("release_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_status_mqtt_client_id_key" ON "device_status"("mqtt_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_status_device_key_key" ON "device_status"("device_key");

-- AddForeignKey
ALTER TABLE "ota_job" ADD CONSTRAINT "ota_job_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "command"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_job" ADD CONSTRAINT "ota_job_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_job" ADD CONSTRAINT "ota_job_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "firmware_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
