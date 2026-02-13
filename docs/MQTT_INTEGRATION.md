# MQTT Integration Guide

## Overview

The Smart Home Backend integrates with MQTT brokers to enable real-time communication with IoT devices. This guide covers MQTT setup, device integration, and message protocols.

## MQTT Architecture

```
IoT Devices ←→ MQTT Broker ←→ Smart Home Backend ←→ Frontend/Mobile Apps
```

### Components

1. **MQTT Broker** - Message broker (Mosquitto, HiveMQ, etc.)
2. **IoT Devices** - ESP32/Arduino devices with sensors
3. **Backend Service** - Processes MQTT messages and stores data
4. **WebSocket Gateway** - Real-time updates to frontend clients

## MQTT Broker Setup

### Option 1: Mosquitto (Recommended)

#### Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Docker
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

#### Configuration

```conf
# /etc/mosquitto/mosquitto.conf

# Basic settings
pid_file /var/run/mosquitto.pid
persistence true
persistence_location /var/lib/mosquitto/

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information

# Network settings
port 1883
bind_address 0.0.0.0

# WebSocket support (optional)
listener 9001
protocol websockets

# Authentication (recommended for production)
allow_anonymous false
password_file /etc/mosquitto/passwd

# Access Control Lists
acl_file /etc/mosquitto/acl.conf

# Security settings
max_connections 1000
max_inflight_messages 100
max_queued_messages 1000
message_size_limit 1048576
```

#### Authentication Setup

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd smarthome_backend
sudo mosquitto_passwd /etc/mosquitto/passwd device_001

# Create ACL file
sudo nano /etc/mosquitto/acl.conf
```

```conf
# /etc/mosquitto/acl.conf

# Backend service permissions
user smarthome_backend
topic readwrite smarthome/+/+/telemetry
topic readwrite smarthome/+/+/commands
topic readwrite smarthome/+/+/status
topic readwrite smarthome/+/+/config

# Device permissions (per device)
user device_001
topic write smarthome/home1/device1/telemetry
topic write smarthome/home1/device1/status
topic read smarthome/home1/device1/commands
topic read smarthome/home1/device1/config

# Pattern for all devices
pattern read smarthome/%u/+/commands
pattern read smarthome/%u/+/config
pattern write smarthome/%u/+/telemetry
pattern write smarthome/%u/+/status
```

### Option 2: HiveMQ Community Edition

```bash
# Download and install HiveMQ CE
wget https://github.com/hivemq/hivemq-community-edition/releases/download/2023.5/hivemq-ce-2023.5.zip
unzip hivemq-ce-2023.5.zip
cd hivemq-ce-2023.5

# Start HiveMQ
./bin/run.sh
```

## Backend MQTT Integration

### MQTT Client Configuration

```typescript
// src/mqtt/client.ts
import mqtt from "mqtt";
import { prisma } from "../lib/prisma";
import { processTelemetryData } from "../services/telemetry/telemetry.service";

export class MQTTClient {
  private client: mqtt.MqttClient;
  private isConnected = false;

  constructor() {
    this.client = mqtt.connect(
      process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
      {
        clientId: `smarthome_backend_${Date.now()}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        keepalive: 60,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        clean: true,
      },
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on("connect", () => {
      console.log("[MQTT] Connected to broker");
      this.isConnected = true;
      this.subscribeToTopics();
    });

    this.client.on("disconnect", () => {
      console.log("[MQTT] Disconnected from broker");
      this.isConnected = false;
    });

    this.client.on("error", (error) => {
      console.error("[MQTT] Connection error:", error);
    });

    this.client.on("message", (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  private subscribeToTopics() {
    const topics = [
      "smarthome/+/+/telemetry",
      "smarthome/+/+/status",
      "smarthome/+/+/heartbeat",
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split("/");

      if (topicParts.length !== 4) {
        console.warn("[MQTT] Invalid topic format:", topic);
        return;
      }

      const [, homeId, deviceId, messageType] = topicParts;

      switch (messageType) {
        case "telemetry":
          await this.handleTelemetry(homeId, deviceId, payload);
          break;
        case "status":
          await this.handleDeviceStatus(homeId, deviceId, payload);
          break;
        case "heartbeat":
          await this.handleHeartbeat(homeId, deviceId, payload);
          break;
        default:
          console.warn("[MQTT] Unknown message type:", messageType);
      }
    } catch (error) {
      console.error("[MQTT] Error processing message:", error);
    }
  }

  private async handleTelemetry(
    homeId: string,
    deviceId: string,
    payload: any,
  ) {
    try {
      // Find device by MAC address or device ID
      const device = await prisma.device.findFirst({
        where: {
          OR: [{ id: parseInt(deviceId) }, { macAddress: deviceId }],
        },
      });

      if (!device) {
        console.warn(`[MQTT] Device not found: ${deviceId}`);
        return;
      }

      // Process telemetry data
      await processTelemetryData(device.id, payload);

      console.log(`[MQTT] Processed telemetry for device ${device.deviceName}`);
    } catch (error) {
      console.error("[MQTT] Error handling telemetry:", error);
    }
  }

  private async handleDeviceStatus(
    homeId: string,
    deviceId: string,
    payload: any,
  ) {
    try {
      const device = await prisma.device.findFirst({
        where: {
          OR: [{ id: parseInt(deviceId) }, { macAddress: deviceId }],
        },
      });

      if (!device) return;

      // Update device status
      await prisma.device.update({
        where: { id: device.id },
        data: {
          status: payload.online || false,
          lastSeenAt: new Date(),
          metadata: {
            ...(device.metadata as any),
            lastStatus: payload,
          },
        },
      });

      console.log(
        `[MQTT] Updated status for device ${device.deviceName}: ${payload.online ? "online" : "offline"}`,
      );
    } catch (error) {
      console.error("[MQTT] Error handling device status:", error);
    }
  }

  private async handleHeartbeat(
    homeId: string,
    deviceId: string,
    payload: any,
  ) {
    try {
      const device = await prisma.device.findFirst({
        where: {
          OR: [{ id: parseInt(deviceId) }, { macAddress: deviceId }],
        },
      });

      if (!device) return;

      // Update last seen timestamp
      await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          status: true,
        },
      });
    } catch (error) {
      console.error("[MQTT] Error handling heartbeat:", error);
    }
  }

  // Send command to device
  public sendCommand(
    homeId: number,
    deviceId: number,
    command: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("MQTT client not connected"));
        return;
      }

      const topic = `smarthome/${homeId}/${deviceId}/commands`;
      const message = JSON.stringify(command);

      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Send configuration to device
  public sendConfig(
    homeId: number,
    deviceId: number,
    config: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("MQTT client not connected"));
        return;
      }

      const topic = `smarthome/${homeId}/${deviceId}/config`;
      const message = JSON.stringify(config);

      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

// Singleton instance
export const mqttClient = new MQTTClient();
```

## Message Protocols

### 1. Telemetry Messages

#### Topic Pattern

```
smarthome/{homeId}/{deviceId}/telemetry
```

#### Message Format

```json
{
  "timestamp": "2026-02-13T12:00:00.000Z",
  "deviceId": "ESP32_001",
  "sensors": {
    "current": 0.75,
    "gasPpm": 450,
    "flame": false,
    "binLevel": 45.2,
    "powerW": 120.5,
    "energyKwh": 2.45,
    "voltageV": 220.3,
    "currentA": 0.55,
    "frequencyHz": 50.1,
    "powerFactor": 0.95,
    "distanceCm": 15.2,
    "temperature": 23.5,
    "humidity": 65.2
  },
  "metadata": {
    "firmwareVersion": "v2.1.0",
    "signalStrength": -45,
    "batteryLevel": 85
  }
}
```

### 2. Device Status Messages

#### Topic Pattern

```
smarthome/{homeId}/{deviceId}/status
```

#### Message Format

```json
{
  "timestamp": "2026-02-13T12:00:00.000Z",
  "deviceId": "ESP32_001",
  "online": true,
  "status": {
    "uptime": 86400,
    "freeMemory": 45000,
    "wifiSignal": -45,
    "batteryLevel": 85,
    "firmwareVersion": "v2.1.0"
  },
  "errors": []
}
```

### 3. Command Messages

#### Topic Pattern

```
smarthome/{homeId}/{deviceId}/commands
```

#### Message Format

```json
{
  "commandId": "cmd_123456789",
  "timestamp": "2026-02-13T12:00:00.000Z",
  "type": "SET_POWER",
  "payload": {
    "power": true,
    "brightness": 80,
    "color": "#FF5733"
  },
  "source": "USER",
  "correlationId": "corr_987654321"
}
```

### 4. Configuration Messages

#### Topic Pattern

```
smarthome/{homeId}/{deviceId}/config
```

#### Message Format

```json
{
  "timestamp": "2026-02-13T12:00:00.000Z",
  "config": {
    "sampleRate": 30,
    "alertThresholds": {
      "gas": 800,
      "temperature": 35,
      "humidity": 80
    },
    "powerSaving": true,
    "wifiConfig": {
      "ssid": "SmartHome_Network",
      "reconnectInterval": 30
    },
    "mqttConfig": {
      "keepAlive": 60,
      "qos": 1
    }
  }
}
```

### 5. Heartbeat Messages

#### Topic Pattern

```
smarthome/{homeId}/{deviceId}/heartbeat
```

#### Message Format

```json
{
  "timestamp": "2026-02-13T12:00:00.000Z",
  "deviceId": "ESP32_001",
  "uptime": 86400,
  "freeMemory": 45000,
  "wifiSignal": -45
}
```

## Device Integration Examples

### ESP32 Arduino Code

```cpp
// ESP32 MQTT Client Example
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";

// MQTT settings
const char* mqtt_server = "your-mqtt-broker.com";
const int mqtt_port = 1883;
const char* mqtt_user = "device_001";
const char* mqtt_password = "device-password";

// Device settings
const char* device_id = "ESP32_001";
const char* home_id = "1";

// Topics
String telemetry_topic = "smarthome/" + String(home_id) + "/" + String(device_id) + "/telemetry";
String status_topic = "smarthome/" + String(home_id) + "/" + String(device_id) + "/status";
String command_topic = "smarthome/" + String(home_id) + "/" + String(device_id) + "/commands";
String config_topic = "smarthome/" + String(home_id) + "/" + String(device_id) + "/config";

// Sensors
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define GAS_SENSOR_PIN A0
#define FLAME_SENSOR_PIN 4
#define CURRENT_SENSOR_PIN A1

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Configuration
struct DeviceConfig {
  int sampleRate = 30;
  int gasThreshold = 800;
  int tempThreshold = 35;
  bool powerSaving = false;
} config;

void setup() {
  Serial.begin(115200);

  // Initialize sensors
  dht.begin();
  pinMode(FLAME_SENSOR_PIN, INPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);

  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // Send telemetry data
  static unsigned long lastTelemetry = 0;
  if (millis() - lastTelemetry > config.sampleRate * 1000) {
    sendTelemetry();
    lastTelemetry = millis();
  }

  // Send heartbeat
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 60000) { // Every minute
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  delay(100);
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");

      // Subscribe to command and config topics
      client.subscribe(command_topic.c_str());
      client.subscribe(config_topic.c_str());

      // Send online status
      sendStatus(true);

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void sendTelemetry() {
  DynamicJsonDocument doc(1024);

  // Read sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int gasLevel = analogRead(GAS_SENSOR_PIN);
  bool flameDetected = digitalRead(FLAME_SENSOR_PIN) == LOW;
  float current = analogRead(CURRENT_SENSOR_PIN) * (5.0 / 1023.0); // Convert to voltage then current

  // Create telemetry message
  doc["timestamp"] = getTimestamp();
  doc["deviceId"] = device_id;

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["temperature"] = temperature;
  sensors["humidity"] = humidity;
  sensors["gasPpm"] = gasLevel;
  sensors["flame"] = flameDetected;
  sensors["current"] = current;

  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["firmwareVersion"] = "v2.1.0";
  metadata["signalStrength"] = WiFi.RSSI();
  metadata["freeMemory"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  client.publish(telemetry_topic.c_str(), payload.c_str());
  Serial.println("Telemetry sent: " + payload);
}

void sendStatus(bool online) {
  DynamicJsonDocument doc(512);

  doc["timestamp"] = getTimestamp();
  doc["deviceId"] = device_id;
  doc["online"] = online;

  JsonObject status = doc.createNestedObject("status");
  status["uptime"] = millis() / 1000;
  status["freeMemory"] = ESP.getFreeHeap();
  status["wifiSignal"] = WiFi.RSSI();
  status["firmwareVersion"] = "v2.1.0";

  String payload;
  serializeJson(doc, payload);

  client.publish(status_topic.c_str(), payload.c_str());
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);

  doc["timestamp"] = getTimestamp();
  doc["deviceId"] = device_id;
  doc["uptime"] = millis() / 1000;
  doc["freeMemory"] = ESP.getFreeHeap();
  doc["wifiSignal"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  String heartbeat_topic = "smarthome/" + String(home_id) + "/" + String(device_id) + "/heartbeat";
  client.publish(heartbeat_topic.c_str(), payload.c_str());
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("Message received [" + String(topic) + "]: " + message);

  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);

  if (String(topic) == command_topic) {
    handleCommand(doc);
  } else if (String(topic) == config_topic) {
    handleConfig(doc);
  }
}

void handleCommand(DynamicJsonDocument& doc) {
  String commandType = doc["type"];
  JsonObject payload = doc["payload"];

  if (commandType == "SET_POWER") {
    bool power = payload["power"];
    // Implement power control logic
    Serial.println("Power command: " + String(power ? "ON" : "OFF"));
  } else if (commandType == "RESET") {
    ESP.restart();
  }
}

void handleConfig(DynamicJsonDocument& doc) {
  JsonObject configObj = doc["config"];

  if (configObj.containsKey("sampleRate")) {
    config.sampleRate = configObj["sampleRate"];
  }

  if (configObj.containsKey("alertThresholds")) {
    JsonObject thresholds = configObj["alertThresholds"];
    if (thresholds.containsKey("gas")) {
      config.gasThreshold = thresholds["gas"];
    }
  }

  Serial.println("Configuration updated");
}

String getTimestamp() {
  // In a real implementation, you would sync with NTP
  return String(millis());
}
```

## Testing MQTT Integration

### Using MQTT CLI Tools

```bash
# Subscribe to all telemetry messages
mosquitto_sub -h localhost -t "smarthome/+/+/telemetry" -u smarthome_backend -P password

# Send test command
mosquitto_pub -h localhost -t "smarthome/1/ESP32_001/commands" -u smarthome_backend -P password -m '{
  "commandId": "test_123",
  "timestamp": "2026-02-13T12:00:00.000Z",
  "type": "SET_POWER",
  "payload": {"power": true},
  "source": "TEST"
}'

# Monitor device status
mosquitto_sub -h localhost -t "smarthome/+/+/status" -u smarthome_backend -P password
```

### Using Node.js Test Client

```javascript
// test-mqtt-client.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://localhost:1883", {
  username: "smarthome_backend",
  password: "password",
});

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to all topics
  client.subscribe("smarthome/+/+/+");

  // Send test telemetry
  setInterval(() => {
    const telemetry = {
      timestamp: new Date().toISOString(),
      deviceId: "TEST_DEVICE",
      sensors: {
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 20,
        gasPpm: Math.floor(Math.random() * 500),
        flame: Math.random() > 0.9,
        current: Math.random() * 2,
      },
    };

    client.publish(
      "smarthome/1/TEST_DEVICE/telemetry",
      JSON.stringify(telemetry),
    );
  }, 5000);
});

client.on("message", (topic, message) => {
  console.log(`[${topic}] ${message.toString()}`);
});
```

## Security Best Practices

### 1. Authentication & Authorization

- Use strong passwords for MQTT users
- Implement per-device authentication
- Use ACLs to restrict topic access
- Rotate credentials regularly

### 2. Encryption

```bash
# Generate SSL certificates for MQTT broker
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 1826 -key ca.key -out ca.crt
openssl genrsa -out server.key 2048
openssl req -new -out server.csr -key server.key
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 360
```

```conf
# Mosquitto SSL configuration
port 8883
cafile /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key
require_certificate true
```

### 3. Network Security

- Use VPN for device communication
- Implement firewall rules
- Monitor MQTT traffic
- Use separate network for IoT devices

## Monitoring & Debugging

### MQTT Broker Monitoring

```bash
# Monitor Mosquitto logs
tail -f /var/log/mosquitto/mosquitto.log

# Check active connections
mosquitto_sub -h localhost -t '$SYS/broker/clients/connected' -u admin -P password

# Monitor message throughput
mosquitto_sub -h localhost -t '$SYS/broker/messages/received' -u admin -P password
```

### Application Monitoring

```typescript
// Add MQTT metrics to your monitoring
export class MQTTMetrics {
  private static messagesReceived = 0;
  private static messagesSent = 0;
  private static connectionErrors = 0;

  static incrementReceived() {
    this.messagesReceived++;
  }

  static incrementSent() {
    this.messagesSent++;
  }

  static incrementErrors() {
    this.connectionErrors++;
  }

  static getMetrics() {
    return {
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
      connectionErrors: this.connectionErrors,
    };
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check MQTT broker is running
   - Verify credentials
   - Check firewall settings

2. **Messages Not Received**
   - Verify topic subscriptions
   - Check QoS levels
   - Validate message format

3. **High Latency**
   - Check network connectivity
   - Optimize message size
   - Adjust keep-alive settings

### Debug Tools

```bash
# Test MQTT connectivity
mosquitto_pub -h broker.example.com -p 1883 -t test/topic -m "Hello World"

# Monitor all MQTT traffic
tcpdump -i any port 1883

# Check MQTT broker performance
mosquitto_sub -h localhost -t '$SYS/broker/+' -u admin -P password
```

---

This MQTT integration guide provides comprehensive coverage of setting up and managing MQTT communication for your Smart Home Backend. Follow the security best practices and monitoring guidelines to ensure reliable and secure device communication.
