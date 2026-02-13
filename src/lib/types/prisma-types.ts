// Temporary Prisma types to work around generation issues

export enum AnomalyMetric {
  POWER = "POWER",
  GAS = "GAS",
  FLAME = "FLAME",
  TRASH = "TRASH",
  VOLTAGE = "VOLTAGE",
  CURRENT = "CURRENT",
  SENSOR_MALFUNCTION = "SENSOR_MALFUNCTION",
}

export enum AlarmSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AlarmSource {
  DEVICE = "DEVICE",
  BACKEND = "BACKEND",
  AI = "AI",
  USER = "USER",
}

export enum AlarmStatus {
  OPEN = "OPEN",
  ACKED = "ACKED",
  RESOLVED = "RESOLVED",
}

export enum CommandStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  ACKED = "ACKED",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
}

export enum CommandSource {
  USER = "USER",
  BACKEND = "BACKEND",
  AI = "AI",
  ADMIN = "ADMIN",
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum DeviceType {
  LIGHT = "LIGHT",
  FAN = "FAN",
  BELL = "BELL",
  DOOR = "DOOR",
  SENSOR_NODE = "SENSOR_NODE",
  POWER_METER = "POWER_METER",
  OTHER = "OTHER",
}

export enum HomeMemberRole {
  OWNER = "OWNER",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export enum HomeMemberStatus {
  INVITED = "INVITED",
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}

export enum NotificationChannel {
  FCM = "FCM",
  MQTT = "MQTT",
  WS = "WS",
  SSE = "SSE",
  WEBHOOK = "WEBHOOK",
  CUSTOM = "CUSTOM",
}

export enum NotificationDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

export enum OtaJobStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DOWNLOADING = "DOWNLOADING",
  APPLIED = "APPLIED",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
}

export enum PairingMethod {
  DEVICE_KEY = "DEVICE_KEY",
  QR_CODE = "QR_CODE",
  ADMIN = "ADMIN",
  OTHER = "OTHER",
}

export enum DeviceEventSeverity {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}
