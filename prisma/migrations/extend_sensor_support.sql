-- Migration to extend PZEM004 v3 and Ultrasonic sensor support
-- Add missing fields to SensorData table

ALTER TABLE sensor_data 
ADD COLUMN voltage_v REAL,
ADD COLUMN current_a REAL, 
ADD COLUMN frequency_hz REAL,
ADD COLUMN power_factor REAL,
ADD COLUMN distance_cm REAL;

-- Add indexes for new fields
CREATE INDEX idx_sensor_data_voltage ON sensor_data(device_id, voltage_v, timestamp);
CREATE INDEX idx_sensor_data_current ON sensor_data(device_id, current_a, timestamp);
CREATE INDEX idx_sensor_data_distance ON sensor_data(device_id, distance_cm, timestamp);

-- Add comments for documentation
COMMENT ON COLUMN sensor_data.voltage_v IS 'PZEM004 v3: Voltage measurement in Volts';
COMMENT ON COLUMN sensor_data.current_a IS 'PZEM004 v3: Current measurement in Amperes';
COMMENT ON COLUMN sensor_data.frequency_hz IS 'PZEM004 v3: Frequency measurement in Hz';
COMMENT ON COLUMN sensor_data.power_factor IS 'PZEM004 v3: Power factor (cos φ)';
COMMENT ON COLUMN sensor_data.distance_cm IS 'Ultrasonic sensor: Raw distance measurement in centimeters';