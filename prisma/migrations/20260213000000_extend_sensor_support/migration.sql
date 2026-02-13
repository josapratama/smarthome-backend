-- CreateExtendedSensorSupport
-- Add PZEM004 v3 and Ultrasonic sensor fields to SensorData

-- Add new columns to sensor_data table
ALTER TABLE "sensor_data" 
ADD COLUMN "voltage_v" DOUBLE PRECISION,
ADD COLUMN "current_a" DOUBLE PRECISION,
ADD COLUMN "frequency_hz" DOUBLE PRECISION,
ADD COLUMN "power_factor" DOUBLE PRECISION,
ADD COLUMN "distance_cm" DOUBLE PRECISION;

-- Add indexes for performance on new fields
CREATE INDEX "sensor_data_voltage_v_idx" ON "sensor_data"("device_id", "voltage_v", "timestamp");
CREATE INDEX "sensor_data_current_a_idx" ON "sensor_data"("device_id", "current_a", "timestamp");
CREATE INDEX "sensor_data_distance_cm_idx" ON "sensor_data"("device_id", "distance_cm", "timestamp");