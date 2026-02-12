-- DropIndex
DROP INDEX "device_status_device_key_key";

-- DropIndex
DROP INDEX "device_status_mqtt_client_id_key";

-- DropIndex
DROP INDEX "firmware_release_platform_version_key";

-- DropIndex
DROP INDEX "home_member_home_id_user_id_key";

-- DropIndex
DROP INDEX "notification_endpoint_value_key";

-- DropIndex
DROP INDEX "room_home_id_name_key";

-- AlterTable
ALTER TABLE "device_status" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "firmware_release" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "home" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "home_member" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notification_endpoint" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "room" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "device_status_deleted_at_idx" ON "device_status"("deleted_at");

-- CreateIndex
CREATE INDEX "device_status_mqtt_client_id_idx" ON "device_status"("mqtt_client_id");

-- CreateIndex
CREATE INDEX "device_status_device_key_idx" ON "device_status"("device_key");

-- CreateIndex
CREATE INDEX "firmware_release_platform_version_idx" ON "firmware_release"("platform", "version");

-- CreateIndex
CREATE INDEX "firmware_release_deleted_at_idx" ON "firmware_release"("deleted_at");

-- CreateIndex
CREATE INDEX "home_deleted_at_idx" ON "home"("deleted_at");

-- CreateIndex
CREATE INDEX "home_member_home_id_user_id_idx" ON "home_member"("home_id", "user_id");

-- CreateIndex
CREATE INDEX "home_member_deleted_at_idx" ON "home_member"("deleted_at");

-- CreateIndex
CREATE INDEX "notification_endpoint_value_idx" ON "notification_endpoint"("value");

-- CreateIndex
CREATE INDEX "notification_endpoint_deleted_at_idx" ON "notification_endpoint"("deleted_at");

-- CreateIndex
CREATE INDEX "room_home_id_name_idx" ON "room"("home_id", "name");

-- CreateIndex
CREATE INDEX "room_deleted_at_idx" ON "room"("deleted_at");
