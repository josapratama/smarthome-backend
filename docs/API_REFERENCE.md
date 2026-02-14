# Smart Home Backend API Reference

## Overview

The Smart Home Backend provides a comprehensive REST API for managing IoT devices, homes, users, and AI-powered analytics. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All API endpoints require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

## API Endpoints

### 🏠 **Home Management**

#### List User Homes

```http
GET /api/v1/homes
```

#### Create Home

```http
POST /api/v1/homes
Content-Type: application/json

{
  "name": "My Smart Home",
  "address": "123 Main St, City, Country",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Get Home Details

```http
GET /api/v1/homes/{homeId}
```

#### Update Home

```http
PATCH /api/v1/homes/{homeId}
Content-Type: application/json

{
  "name": "Updated Home Name",
  "address": "New Address"
}
```

#### Delete Home

```http
DELETE /api/v1/homes/{homeId}
```

### 👥 **Home Members**

#### List Home Members

```http
GET /api/v1/homes/{homeId}/members
```

#### Add Member to Home

```http
POST /api/v1/homes/{homeId}/members
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

#### Update Member Role

```http
PATCH /api/v1/homes/{homeId}/members/{userId}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### Remove Member

```http
DELETE /api/v1/homes/{homeId}/members/{userId}
```

### 🏠 **Room Management**

#### List Rooms in Home

```http
GET /api/v1/homes/{homeId}/rooms
```

#### Create Room

```http
POST /api/v1/homes/{homeId}/rooms
Content-Type: application/json

{
  "name": "Living Room"
}
```

#### Get Room Details

```http
GET /api/v1/rooms/{roomId}
```

#### Update Room

```http
PATCH /api/v1/rooms/{roomId}
Content-Type: application/json

{
  "name": "Updated Room Name"
}
```

#### Delete Room (Soft Delete)

```http
DELETE /api/v1/rooms/{roomId}
```

#### Restore Deleted Room

```http
POST /api/v1/rooms/{roomId}/restore
```

#### List Devices in Room

```http
GET /api/v1/rooms/{roomId}/devices
```

### 📱 **Device Management**

#### List Home Devices

```http
GET /api/v1/homes/{homeId}/devices
```

#### Register New Device

```http
POST /api/v1/homes/{homeId}/devices
Content-Type: application/json

{
  "deviceName": "Smart Sensor 01",
  "deviceType": "SENSOR",
  "roomId": 1,
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

#### Get Device Details

```http
GET /api/v1/devices/{deviceId}
```

#### Update Device

```http
PATCH /api/v1/devices/{deviceId}
Content-Type: application/json

{
  "deviceName": "Updated Device Name",
  "roomId": 2
}
```

#### Delete Device (Soft Delete)

```http
DELETE /api/v1/devices/{deviceId}
```

#### Restore Deleted Device

```http
POST /api/v1/devices/{deviceId}/restore
```

### 📊 **Telemetry & Sensor Data**

#### Ingest Telemetry Data

```http
POST /api/v1/devices/{deviceId}/telemetry
Content-Type: application/json
X-Device-Token: <device-auth-token>

{
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
  "distanceCm": 15.2
}
```

#### Get Latest Telemetry

```http
GET /api/v1/devices/{deviceId}/telemetry/latest
```

#### Query Historical Telemetry

```http
GET /api/v1/devices/{deviceId}/telemetry?from=2026-02-01T00:00:00Z&to=2026-02-14T23:59:59Z&limit=100
```

### 🎛️ **Device Control**

#### Send Command to Device

```http
POST /api/v1/devices/{deviceId}/commands
Content-Type: application/json

{
  "type": "SET_POWER",
  "payload": {
    "power": true,
    "brightness": 80
  },
  "source": "USER"
}
```

#### Get Command Status

```http
GET /api/v1/commands/{commandId}
```

### ⚙️ **Device Configuration**

#### Get Device Configuration

```http
GET /api/v1/devices/{deviceId}/config
```

#### Update Device Configuration

```http
PUT /api/v1/devices/{deviceId}/config
Content-Type: application/json

{
  "config": {
    "sampleRate": 30,
    "alertThresholds": {
      "gas": 800,
      "temperature": 35
    },
    "powerSaving": true
  }
}
```

### 🚨 **Alarms & Notifications**

#### List Home Alarms

```http
GET /api/v1/homes/{homeId}/alarms?status=ACTIVE&limit=50
```

#### Create Alarm

```http
POST /api/v1/homes/{homeId}/alarms
Content-Type: application/json

{
  "deviceId": 1,
  "type": "GAS_LEAK",
  "severity": "HIGH",
  "message": "Gas leak detected in kitchen",
  "metadata": {
    "gasPpm": 1200,
    "threshold": 800
  }
}
```

#### Acknowledge Alarm

```http
POST /api/v1/homes/{homeId}/alarms/{alarmId}/acknowledge
```

#### Resolve Alarm

```http
POST /api/v1/homes/{homeId}/alarms/{alarmId}/resolve
```

### 🔔 **Notification Endpoints**

#### List My Notification Endpoints

```http
GET /api/v1/notifications/endpoints
```

#### Create Notification Endpoint

```http
POST /api/v1/notifications/endpoints
Content-Type: application/json

{
  "type": "EMAIL",
  "endpoint": "user@example.com",
  "isActive": true
}
```

#### Delete Notification Endpoint

```http
DELETE /api/v1/notifications/endpoints/{endpointId}
```

### 🔗 **Home Invitations**

#### Create Home Invitation

```http
POST /api/v1/homes/{homeId}/invites
Content-Type: application/json

{
  "email": "friend@example.com",
  "role": "MEMBER",
  "expiresAt": "2026-03-01T00:00:00Z"
}
```

#### Accept Invitation

```http
POST /api/v1/invites/{token}/accept
```

#### List Home Invitations

```http
GET /api/v1/homes/{homeId}/invites
```

#### Revoke Invitation

```http
DELETE /api/v1/invites/{inviteId}
```

### 🔄 **Firmware & OTA Updates**

#### List Firmware Releases

```http
GET /api/v1/firmware/releases?platform=ESP32&limit=10
```

#### Upload Firmware Release

```http
POST /api/v1/firmware/releases
Content-Type: multipart/form-data

{
  "version": "v2.1.0",
  "platform": "ESP32",
  "description": "Bug fixes and new features",
  "file": <binary-file>
}
```

#### Download Firmware

```http
GET /api/v1/firmware/releases/{releaseId}/download
```

#### Trigger OTA Update

```http
POST /api/v1/devices/{deviceId}/ota
Content-Type: application/json

{
  "releaseId": 5
}
```

#### Get OTA Job Status

```http
GET /api/v1/ota/jobs/{otaJobId}
```

#### List Device OTA Jobs

```http
GET /api/v1/devices/{deviceId}/ota/jobs?limit=10
```

### 🤖 **AI & Analytics**

#### Generate Energy Prediction

```http
POST /api/v1/devices/{deviceId}/energy-predictions
Content-Type: application/json

{
  "windowStart": "2026-02-14T00:00:00Z",
  "windowEnd": "2026-02-15T00:00:00Z",
  "modelVersion": "v1.0.0"
}
```

#### Get Device Predictions

```http
GET /api/v1/devices/{deviceId}/energy-predictions?from=2026-02-01T00:00:00Z&limit=50
```

#### Update Prediction with Actual Data

```http
PATCH /api/v1/predictions/{predictionId}
Content-Type: application/json

{
  "actualEnergy": 2.45
}
```

#### Detect Anomalies

```http
POST /api/v1/predictions/{predictionId}/anomalies
Content-Type: application/json

{
  "sensorData": {
    "current": 0.75,
    "gasPpm": 1200,
    "flame": false,
    "binLevel": 45.2,
    "powerW": 250.5,
    "voltageV": 220.3,
    "currentA": 1.14
  },
  "historicalWindow": 24
}
```

#### Get Device AI Insights

```http
GET /api/v1/devices/{deviceId}/ai-insights?days=7
```

#### Process Telemetry through AI Pipeline

```http
POST /api/v1/devices/{deviceId}/process-telemetry
Content-Type: application/json

{
  "sensorData": {
    "current": 0.75,
    "gasPpm": 450,
    "flame": false,
    "binLevel": 45.2,
    "powerW": 120.5,
    "voltageV": 220.3,
    "currentA": 0.55
  },
  "timestamp": "2026-02-13T12:00:00Z"
}
```

### 🧠 **AI Model Management**

#### List AI Models

```http
GET /api/v1/ai-models?isActive=true&algorithm=linear_regression&limit=10
```

#### Create AI Model

```http
POST /api/v1/ai-models
Content-Type: application/json

{
  "name": "advanced-predictor-v2",
  "version": "2.0.0",
  "algorithm": "seasonal_decomposition",
  "parameters": {
    "windowSize": 48,
    "seasonalFactor": 0.15,
    "trendFactor": 0.25
  },
  "description": "Advanced seasonal prediction model"
}
```

#### Get AI Model Details

```http
GET /api/v1/ai-models/{modelName}
```

#### Update AI Model

```http
PATCH /api/v1/ai-models/{modelName}
Content-Type: application/json

{
  "version": "2.1.0",
  "parameters": {
    "windowSize": 72,
    "seasonalFactor": 0.2
  },
  "description": "Updated with improved parameters"
}
```

#### Activate AI Model

```http
POST /api/v1/ai-models/{modelName}/activate
```

#### Delete AI Model

```http
DELETE /api/v1/ai-models/{modelName}
```

#### Get Model Performance Metrics

```http
GET /api/v1/ai-models/performance?modelName=advanced-predictor-v2&deviceId=1&from=2026-02-01T00:00:00Z&limit=100
```

#### Compare AI Models

```http
GET /api/v1/ai-models/compare?algorithms=linear_regression,seasonal_decomposition&deviceId=1&days=30
```

#### Get Best Model for Device

```http
GET /api/v1/devices/{deviceId}/best-model?days=30
```

### 📈 **Dashboard & Overview**

#### Get Dashboard Analytics

```http
GET /api/v1/dashboard
```

#### Get Home Overview

```http
GET /api/v1/homes/{homeId}/overview
```

#### Get Home Attention Items

```http
GET /api/v1/homes/{homeId}/attention?limit=20&offlineMinutes=5
```

## Response Format

### Success Response

```json
{
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2026-02-13T12:00:00Z",
    "version": "v1.0.0"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-13T12:00:00Z",
    "requestId": "req_123456789"
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- **General API**: 1000 requests per hour per user
- **Telemetry Ingestion**: 10 requests per minute per device
- **AI Processing**: 100 requests per hour per user

## Pagination

List endpoints support pagination:

```http
GET /api/v1/homes/{homeId}/devices?page=1&limit=20&sort=createdAt&order=desc
```

## Filtering & Sorting

Most list endpoints support filtering and sorting:

```http
GET /api/v1/devices?status=true&deviceType=SENSOR&sort=lastSeenAt&order=desc
```

## WebSocket Events

Real-time updates are available via WebSocket:

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");

// Subscribe to device updates
ws.send(
  JSON.stringify({
    type: "subscribe",
    channel: "device:1:telemetry",
  }),
);
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { SmartHomeAPI } from "@smarthome/api-client";

const api = new SmartHomeAPI({
  baseURL: "http://localhost:3000/api/v1",
  token: "your-jwt-token",
});

// Get home devices
const devices = await api.homes.getDevices(homeId);

// Send telemetry
await api.devices.sendTelemetry(deviceId, {
  current: 0.75,
  gasPpm: 450,
  powerW: 120.5,
});
```

### Python

```python
from smarthome_api import SmartHomeClient

client = SmartHomeClient(
    base_url='http://localhost:3000/api/v1',
    token='your-jwt-token'
)

# Get device insights
insights = client.ai.get_device_insights(device_id=1, days=7)
```

### cURL Examples

See individual endpoint documentation above for cURL examples.

## Testing

Use the interactive Swagger UI at `/docs` to test API endpoints:

```
http://localhost:3000/docs
```

## Support

- **Documentation**: `/docs` (Swagger UI)
- **OpenAPI Spec**: `/openapi.json`
- **AsyncAPI Spec**: `/docs/asyncapi.yaml`
- **Health Check**: `/health`

---

For more detailed information about specific features, see the dedicated documentation files in the `/docs` directory.
