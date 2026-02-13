# Smart Home AI System Documentation

## Overview

The Smart Home AI System provides intelligent energy prediction and anomaly detection capabilities for IoT devices. It automatically analyzes sensor data to predict energy consumption, detect anomalies, and generate actionable insights.

## Architecture

### Core Components

1. **Energy Prediction Service** - Predicts future energy consumption using historical data
2. **Anomaly Detection Service** - Identifies unusual patterns in sensor readings
3. **AI Orchestration Service** - Coordinates AI processing pipeline
4. **AI Workers** - Background processes for automated AI tasks

### Data Flow

```
Sensor Data → Telemetry Service → AI Processing → Predictions & Anomalies → Alarms & Insights
```

## Features

### 1. Energy Prediction

**Algorithms Available:**

- **Moving Average**: Simple average-based prediction with seasonal adjustments
- **Linear Regression**: Trend-based prediction using historical patterns
- **Seasonal Decomposition**: Advanced seasonal pattern recognition

**Capabilities:**

- 24-hour energy consumption forecasting
- Multiple prediction models with accuracy tracking
- Automatic model selection based on data quality
- Historical accuracy analysis for model improvement

### 2. Anomaly Detection

**Detection Methods:**

- **Statistical Analysis**: Z-score based anomaly detection
- **Threshold Monitoring**: Absolute value threshold checking
- **Pattern Recognition**: Historical pattern deviation analysis

**Supported Metrics:**

- **Power Anomalies**: Unusual energy consumption patterns
- **Gas Anomalies**: Gas leak detection and concentration spikes
- **Flame Anomalies**: Fire detection and flame presence
- **Trash Anomalies**: Bin overflow and unusual fill patterns
- **Voltage Anomalies**: Electrical system monitoring (PZEM004 v3)
- **Sensor Malfunctions**: Equipment failure detection

### 3. Automated Processing

**Real-time Processing:**

- Automatic AI analysis on telemetry ingestion
- Immediate anomaly detection and alerting
- Real-time prediction updates

**Background Workers:**

- **Prediction Update Worker**: Updates predictions with actual consumption data
- **Daily Prediction Worker**: Generates daily forecasts for all devices
- **Model Accuracy Tracking**: Continuous model performance monitoring

## API Endpoints

### Energy Predictions

```http
POST /api/v1/devices/{deviceId}/energy-predictions
GET  /api/v1/devices/{deviceId}/energy-predictions
PATCH /api/v1/predictions/{predictionId}
```

### Anomaly Detection

```http
POST /api/v1/predictions/{predictionId}/anomalies
GET  /api/v1/predictions/{predictionId}/anomalies
```

### AI Insights

```http
GET  /api/v1/devices/{deviceId}/ai-insights
POST /api/v1/devices/{deviceId}/process-telemetry
```

## Configuration

### Environment Variables

```bash
# AI Processing (optional)
AI_PREDICTION_INTERVAL=30  # Minutes between prediction updates
AI_DAILY_PREDICTION_TIME=00:05  # Time for daily predictions (HH:MM)
AI_MODEL_VERSION=v1.0.0  # Default model version
AI_ENABLE_AUTO_PROCESSING=true  # Enable automatic AI processing
```

### Model Parameters

**Moving Average Model:**

```json
{
  "windowSize": 24, // Hours of historical data
  "seasonalFactor": 0.1, // Seasonal adjustment strength
  "trendFactor": 0.2 // Trend adjustment strength
}
```

**Anomaly Detection Thresholds:**

```json
{
  "gas": {
    "warning": 800, // ppm
    "critical": 1200 // ppm
  },
  "voltage": {
    "min": 200, // V
    "max": 250 // V
  },
  "current": {
    "warning": 10, // A
    "critical": 15 // A
  }
}
```

## Usage Examples

### 1. Generate Energy Prediction

```bash
curl -X POST http://localhost:3000/api/v1/devices/1/energy-predictions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "windowStart": "2026-02-14T00:00:00.000Z",
    "windowEnd": "2026-02-15T00:00:00.000Z",
    "modelVersion": "v1.0.0"
  }'
```

### 2. Detect Anomalies

```bash
curl -X POST http://localhost:3000/api/v1/predictions/1/anomalies \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "sensorData": {
      "current": 0.75,
      "gasPpm": 1500,
      "flame": false,
      "binLevel": 45.2,
      "powerW": 250.5,
      "voltageV": 220.3,
      "currentA": 1.14
    },
    "historicalWindow": 24
  }'
```

### 3. Get Device AI Insights

```bash
curl -X GET "http://localhost:3000/api/v1/devices/1/ai-insights?days=7" \
  -H 'Authorization: Bearer <token>'
```

## Integration Guide

### 1. Enable AI Processing in Telemetry

```typescript
import { ingestTelemetry } from "./services/telemetry/telemetry.service";

// Enable AI processing (default: true)
const result = await ingestTelemetry({
  deviceId: 1,
  telemetry: sensorData,
  enableAI: true, // AI processing enabled
});

// Access AI results
if (result.aiResult) {
  console.log("Prediction:", result.aiResult.prediction);
  console.log("Anomalies:", result.aiResult.anomalies);
}
```

### 2. Custom Prediction Models

```typescript
import { EnergyPredictionService } from "./services/ai/ai.service";

// Generate prediction with custom model
const prediction = await EnergyPredictionService.generatePrediction({
  deviceId: 1,
  windowStart: new Date("2026-02-14T00:00:00Z"),
  windowEnd: new Date("2026-02-15T00:00:00Z"),
  modelVersion: "custom-v2.0.0",
});
```

### 3. Manual Anomaly Detection

```typescript
import { AnomalyDetectionService } from "./services/ai/ai.service";

const anomalies = await AnomalyDetectionService.detectAnomalies({
  predictionId: 1,
  sensorData: {
    current: 0.75,
    gasPpm: 850,
    flame: false,
    binLevel: 45.2,
    powerW: 120.5,
    voltageV: 220.3,
    currentA: 0.55,
  },
  historicalWindow: 48, // 48 hours of history
});
```

## Performance Considerations

### 1. Data Requirements

- **Minimum Data**: 24 hours of historical data for basic predictions
- **Optimal Data**: 30 days of historical data for accurate predictions
- **Anomaly Detection**: 10+ data points for statistical analysis

### 2. Processing Optimization

- AI processing is asynchronous and non-blocking
- Predictions are cached and reused when possible
- Background workers handle batch processing
- Database queries are optimized with proper indexing

### 3. Scalability

- Horizontal scaling supported through stateless design
- Database connection pooling for concurrent processing
- Configurable worker intervals to balance accuracy vs. performance
- Automatic cleanup of old predictions and anomalies

## Monitoring & Debugging

### 1. Logging

AI system provides comprehensive logging:

```
[AI] Processing telemetry for device 1
[AI] Generated prediction: 2.45kWh (accuracy: 0.87)
[AI] Detected 2 anomalies: gas_leak, voltage_abnormal
[AI Worker] Updated 15 predictions, accuracy improved to 0.91
```

### 2. Health Checks

Monitor AI system health through:

- Prediction accuracy metrics
- Anomaly detection rates
- Worker execution status
- Model performance trends

### 3. Troubleshooting

**Common Issues:**

1. **Insufficient Data Error**
   - Ensure device has 24+ hours of power data
   - Check sensor data quality and completeness

2. **Low Prediction Accuracy**
   - Increase historical data window
   - Consider seasonal patterns in usage
   - Verify sensor calibration

3. **False Anomaly Alerts**
   - Adjust detection thresholds
   - Increase historical window size
   - Review baseline data quality

## Future Enhancements

### Planned Features

1. **Machine Learning Models**
   - Neural network-based predictions
   - Automated feature engineering
   - Multi-device correlation analysis

2. **Advanced Analytics**
   - Energy efficiency recommendations
   - Usage pattern optimization
   - Predictive maintenance alerts

3. **Integration Capabilities**
   - External weather data integration
   - Smart grid integration
   - Third-party AI service connectors

### Model Improvements

1. **Adaptive Learning**
   - Self-improving prediction models
   - Dynamic threshold adjustment
   - Seasonal pattern learning

2. **Multi-Sensor Fusion**
   - Cross-sensor anomaly detection
   - Holistic device health monitoring
   - Environmental correlation analysis

## Security & Privacy

### Data Protection

- All AI processing happens locally on your infrastructure
- No external AI service dependencies by default
- Sensor data is encrypted in transit and at rest
- Prediction models don't expose raw sensor data

### Access Control

- AI endpoints require authentication
- Admin-only access to model configuration
- Audit logging for all AI operations
- Rate limiting on AI processing endpoints

---

For technical support or feature requests, please refer to the main project documentation or create an issue in the repository.
