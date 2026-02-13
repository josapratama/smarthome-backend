import { prisma } from "../../lib/prisma";
import type { AnomalyMetric, AlarmSeverity } from "@prisma/client";

// ===== TYPES =====

export type EnergyPredictionInput = {
  deviceId: number;
  windowStart: Date;
  windowEnd: Date;
  modelVersion?: string;
};

export type AnomalyDetectionInput = {
  predictionId: number;
  sensorData: {
    current: number;
    gasPpm: number;
    flame: boolean;
    binLevel: number;
    powerW?: number;
    energyKwh?: number;
    voltageV?: number;
    currentA?: number;
    frequencyHz?: number;
    powerFactor?: number;
    distanceCm?: number;
  };
  historicalWindow?: number; // hours to look back
};

export type PredictionModel = {
  version: string;
  algorithm: "linear_regression" | "moving_average" | "seasonal_decomposition";
  parameters: Record<string, any>;
};

// ===== ENERGY PREDICTION SERVICE =====

export class EnergyPredictionService {
  private static readonly DEFAULT_MODEL: PredictionModel = {
    version: "v1.0.0",
    algorithm: "moving_average",
    parameters: {
      windowSize: 24, // 24 hours
      seasonalFactor: 0.1,
      trendFactor: 0.2,
    },
  };

  /**
   * Generate energy prediction for a device based on historical data
   */
  static async generatePrediction(input: EnergyPredictionInput) {
    const { deviceId, windowStart, windowEnd, modelVersion } = input;

    // Validate device exists and is active
    const device = await prisma.device.findFirst({
      where: { id: deviceId, deletedAt: null },
      select: { id: true, deviceName: true, deviceType: true },
    });

    if (!device) {
      return { error: "DEVICE_NOT_FOUND" as const };
    }

    // Get historical energy data (last 30 days for training)
    const historicalData = await prisma.sensorData.findMany({
      where: {
        deviceId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          lte: windowStart,
        },
        powerW: { not: null },
      },
      orderBy: { timestamp: "desc" },
      take: 720, // ~30 days of hourly data
    });

    if (historicalData.length < 24) {
      return { error: "INSUFFICIENT_DATA" as const };
    }

    // Apply prediction algorithm
    const model = modelVersion
      ? await this.getModel(modelVersion)
      : this.DEFAULT_MODEL;

    const predictedEnergy = await this.calculatePrediction(
      historicalData,
      windowStart,
      windowEnd,
      model,
    );

    // Store prediction
    const prediction = await prisma.energyPrediction.create({
      data: {
        deviceId,
        predictedEnergy,
        windowStart,
        windowEnd,
        modelVersion: model.version,
      },
    });

    return { prediction };
  }

  /**
   * Update prediction with actual energy consumption
   */
  static async updateWithActual(predictionId: number, actualEnergy: number) {
    const prediction = await prisma.energyPrediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return { error: "PREDICTION_NOT_FOUND" as const };
    }

    const updated = await prisma.energyPrediction.update({
      where: { id: predictionId },
      data: { actualEnergy },
    });

    // Calculate accuracy for model improvement
    const accuracy = this.calculateAccuracy(
      prediction.predictedEnergy,
      actualEnergy,
    );

    return { prediction: updated, accuracy };
  }

  /**
   * Get predictions for a device within date range
   */
  static async getPredictions(params: {
    deviceId: number;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    return prisma.energyPrediction.findMany({
      where: {
        deviceId: params.deviceId,
        createdAt: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 100,
      include: {
        anomalyResults: true,
      },
    });
  }

  // ===== PRIVATE METHODS =====

  private static async calculatePrediction(
    historicalData: any[],
    windowStart: Date,
    windowEnd: Date,
    model: PredictionModel,
  ): Promise<number> {
    const windowHours =
      (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

    switch (model.algorithm) {
      case "moving_average":
        return this.movingAveragePrediction(
          historicalData,
          windowHours,
          model.parameters,
        );

      case "linear_regression":
        return this.linearRegressionPrediction(
          historicalData,
          windowHours,
          model.parameters,
        );

      case "seasonal_decomposition":
        return this.seasonalPrediction(
          historicalData,
          windowHours,
          model.parameters,
        );

      default:
        return this.movingAveragePrediction(
          historicalData,
          windowHours,
          model.parameters,
        );
    }
  }

  private static movingAveragePrediction(
    data: any[],
    windowHours: number,
    params: any,
  ): number {
    const windowSize = params.windowSize || 24;
    const recentData = data.slice(0, windowSize);

    const avgPowerW =
      recentData.reduce((sum, d) => sum + (d.powerW || 0), 0) /
      recentData.length;

    // Apply seasonal and trend factors
    const seasonalFactor = params.seasonalFactor || 0.1;
    const trendFactor = params.trendFactor || 0.2;

    const hour = new Date().getHours();
    const seasonalAdjustment =
      1 + seasonalFactor * Math.sin((hour / 24) * 2 * Math.PI);

    // Simple trend calculation
    const trend =
      recentData.length > 1
        ? (recentData[0].powerW - recentData[recentData.length - 1].powerW) /
          recentData.length
        : 0;

    const adjustedPower = avgPowerW * seasonalAdjustment + trend * trendFactor;

    return Math.max(0, (adjustedPower * windowHours) / 1000); // Convert to kWh
  }

  private static linearRegressionPrediction(
    data: any[],
    windowHours: number,
    params: any,
  ): number {
    // Simple linear regression implementation
    const n = Math.min(data.length, 168); // 1 week max
    const recentData = data.slice(0, n);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    recentData.forEach((d, i) => {
      const x = i;
      const y = d.powerW || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedPower = Math.max(0, intercept + slope * n);

    return (predictedPower * windowHours) / 1000; // Convert to kWh
  }

  private static seasonalPrediction(
    data: any[],
    windowHours: number,
    params: any,
  ): number {
    // Advanced seasonal decomposition (simplified)
    const hourlyPattern = new Array(24).fill(0);
    const dailyPattern = new Array(7).fill(0);

    data.forEach((d) => {
      const date = new Date(d.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      hourlyPattern[hour] += d.powerW || 0;
      dailyPattern[day] += d.powerW || 0;
    });

    // Normalize patterns
    const avgHourly = hourlyPattern.reduce((a, b) => a + b, 0) / 24;
    const avgDaily = dailyPattern.reduce((a, b) => a + b, 0) / 7;

    const now = new Date();
    const hourFactor = hourlyPattern[now.getHours()] / avgHourly || 1;
    const dayFactor = dailyPattern[now.getDay()] / avgDaily || 1;

    const basePower =
      data.slice(0, 24).reduce((sum, d) => sum + (d.powerW || 0), 0) / 24;
    const seasonalPower = basePower * hourFactor * dayFactor;

    return Math.max(0, (seasonalPower * windowHours) / 1000);
  }

  private static calculateAccuracy(predicted: number, actual: number): number {
    if (actual === 0) return predicted === 0 ? 1 : 0;
    return Math.max(0, 1 - Math.abs(predicted - actual) / actual);
  }

  private static async getModel(version: string): Promise<PredictionModel> {
    // In a real implementation, this would fetch from a model registry
    // For now, return default with version
    return {
      ...this.DEFAULT_MODEL,
      version,
    };
  }
}

// ===== ANOMALY DETECTION SERVICE =====

export class AnomalyDetectionService {
  /**
   * Detect anomalies in sensor data
   */
  static async detectAnomalies(input: AnomalyDetectionInput) {
    const { predictionId, sensorData, historicalWindow = 24 } = input;

    // Validate prediction exists
    const prediction = await prisma.energyPrediction.findUnique({
      where: { id: predictionId },
      include: { device: true },
    });

    if (!prediction) {
      return { error: "PREDICTION_NOT_FOUND" as const };
    }

    // Get historical data for baseline
    const historicalData = await prisma.sensorData.findMany({
      where: {
        deviceId: prediction.deviceId,
        timestamp: {
          gte: new Date(Date.now() - historicalWindow * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const anomalies: Array<{
      metric: AnomalyMetric;
      isAnomaly: boolean;
      score: number;
      details: any;
    }> = [];

    // Power anomaly detection
    if (sensorData.powerW !== undefined) {
      const powerAnomaly = this.detectPowerAnomaly(
        sensorData.powerW,
        historicalData,
      );
      anomalies.push({
        metric: "POWER",
        ...powerAnomaly,
      });
    }

    // Gas anomaly detection
    const gasAnomaly = this.detectGasAnomaly(sensorData.gasPpm, historicalData);
    anomalies.push({
      metric: "GAS",
      ...gasAnomaly,
    });

    // Flame anomaly detection
    const flameAnomaly = this.detectFlameAnomaly(
      sensorData.flame,
      historicalData,
    );
    anomalies.push({
      metric: "FLAME",
      ...flameAnomaly,
    });

    // Trash level anomaly detection
    const trashAnomaly = this.detectTrashAnomaly(
      sensorData.binLevel,
      historicalData,
    );
    anomalies.push({
      metric: "TRASH",
      ...trashAnomaly,
    });

    // Store anomaly results
    const results = await Promise.all(
      anomalies.map((anomaly) =>
        prisma.anomalyResult.create({
          data: {
            predictionId,
            isAnomaly: anomaly.isAnomaly,
            score: anomaly.score,
            metric: anomaly.metric,
            details: anomaly.details,
          },
        }),
      ),
    );

    // Trigger alarms for critical anomalies
    await this.triggerAnomalyAlarms(
      prediction.deviceId,
      prediction.device.homeId,
      anomalies,
    );

    return { anomalies: results };
  }

  /**
   * Get anomaly results for a prediction
   */
  static async getAnomalies(predictionId: number) {
    return prisma.anomalyResult.findMany({
      where: { predictionId },
      orderBy: { detectedAt: "desc" },
    });
  }

  /**
   * Get device anomaly summary
   */
  static async getDeviceAnomalySummary(deviceId: number, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const anomalies = await prisma.anomalyResult.findMany({
      where: {
        prediction: { deviceId },
        detectedAt: { gte: since },
        isAnomaly: true,
      },
      include: { prediction: true },
    });

    const summary = {
      totalAnomalies: anomalies.length,
      byMetric: {} as Record<string, number>,
      avgScore: 0,
      criticalCount: 0,
    };

    anomalies.forEach((a) => {
      summary.byMetric[a.metric] = (summary.byMetric[a.metric] || 0) + 1;
      summary.avgScore += a.score;
      if (a.score > 0.8) summary.criticalCount++;
    });

    summary.avgScore =
      anomalies.length > 0 ? summary.avgScore / anomalies.length : 0;

    return summary;
  }

  // ===== PRIVATE ANOMALY DETECTION METHODS =====

  private static detectPowerAnomaly(
    currentPower: number,
    historicalData: any[],
  ) {
    const powerData = historicalData
      .filter((d) => d.powerW !== null)
      .map((d) => d.powerW);

    if (powerData.length < 10) {
      return {
        isAnomaly: false,
        score: 0,
        details: { reason: "insufficient_data" },
      };
    }

    const stats = this.calculateStats(powerData);
    const zScore = Math.abs((currentPower - stats.mean) / stats.stdDev);

    // Z-score > 2.5 is considered anomalous
    const isAnomaly = zScore > 2.5;
    const score = Math.min(zScore / 3, 1); // Normalize to 0-1

    return {
      isAnomaly,
      score,
      details: {
        currentPower,
        historicalMean: stats.mean,
        historicalStdDev: stats.stdDev,
        zScore,
        threshold: 2.5,
      },
    };
  }

  private static detectGasAnomaly(currentGas: number, historicalData: any[]) {
    const gasData = historicalData.map((d) => d.gasPpm);
    const stats = this.calculateStats(gasData);

    // Gas anomaly is more about absolute thresholds + statistical deviation
    const absoluteThreshold = 800; // ppm
    const zScore =
      gasData.length > 10
        ? Math.abs((currentGas - stats.mean) / stats.stdDev)
        : 0;

    const isAbsoluteAnomaly = currentGas > absoluteThreshold;
    const isStatisticalAnomaly = zScore > 2;
    const isAnomaly = isAbsoluteAnomaly || isStatisticalAnomaly;

    const score = Math.max(
      currentGas / 1200, // Normalize by critical threshold
      zScore / 3,
    );

    return {
      isAnomaly,
      score: Math.min(score, 1),
      details: {
        currentGas,
        absoluteThreshold,
        isAbsoluteAnomaly,
        isStatisticalAnomaly,
        zScore,
        historicalMean: stats.mean,
      },
    };
  }

  private static detectFlameAnomaly(
    currentFlame: boolean,
    historicalData: any[],
  ) {
    const flameHistory = historicalData.map((d) => d.flame);
    const flameRate =
      flameHistory.filter((f) => f).length / flameHistory.length;

    // Flame detection is always critical
    const isAnomaly = currentFlame;
    const score = currentFlame ? 1 : 0;

    return {
      isAnomaly,
      score,
      details: {
        currentFlame,
        historicalFlameRate: flameRate,
        reason: currentFlame ? "flame_detected" : "no_flame",
      },
    };
  }

  private static detectTrashAnomaly(
    currentLevel: number,
    historicalData: any[],
  ) {
    const levelData = historicalData.map((d) => d.binLevel);
    const stats = this.calculateStats(levelData);

    // Trash anomaly: sudden jumps or very high levels
    const absoluteThreshold = 85; // %
    const zScore =
      levelData.length > 10
        ? Math.abs((currentLevel - stats.mean) / stats.stdDev)
        : 0;

    const isAbsoluteAnomaly = currentLevel > absoluteThreshold;
    const isStatisticalAnomaly = zScore > 2.5;
    const isAnomaly = isAbsoluteAnomaly || isStatisticalAnomaly;

    const score = Math.max(
      currentLevel / 100, // Normalize by 100%
      zScore / 3,
    );

    return {
      isAnomaly,
      score: Math.min(score, 1),
      details: {
        currentLevel,
        absoluteThreshold,
        isAbsoluteAnomaly,
        isStatisticalAnomaly,
        zScore,
        historicalMean: stats.mean,
      },
    };
  }

  private static calculateStats(data: number[]) {
    if (data.length === 0) return { mean: 0, stdDev: 0 };

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  private static async triggerAnomalyAlarms(
    deviceId: number,
    homeId: number,
    anomalies: Array<{
      metric: AnomalyMetric;
      isAnomaly: boolean;
      score: number;
      details: any;
    }>,
  ) {
    const criticalAnomalies = anomalies.filter(
      (a) => a.isAnomaly && a.score > 0.7,
    );

    for (const anomaly of criticalAnomalies) {
      const severity: AlarmSeverity = anomaly.score > 0.9 ? "CRITICAL" : "HIGH";

      await prisma.alarmEvent.create({
        data: {
          deviceId,
          homeId,
          type: `anomaly_${anomaly.metric.toLowerCase()}`,
          message: `AI detected ${anomaly.metric} anomaly (score: ${anomaly.score.toFixed(2)})`,
          severity,
          source: "AI",
          status: "OPEN",
        },
      });
    }
  }
}

// ===== AI ORCHESTRATION SERVICE =====

export class AIOrchestrationService {
  /**
   * Process telemetry data through AI pipeline
   */
  static async processTelemetryAI(params: {
    deviceId: number;
    sensorData: any;
    timestamp?: Date;
  }) {
    const { deviceId, sensorData, timestamp = new Date() } = params;

    try {
      // 1. Generate energy prediction for next 24 hours
      const windowStart = timestamp;
      const windowEnd = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);

      const predictionResult = await EnergyPredictionService.generatePrediction(
        {
          deviceId,
          windowStart,
          windowEnd,
        },
      );

      if (predictionResult.error) {
        console.warn(
          `[AI] Prediction failed for device ${deviceId}:`,
          predictionResult.error,
        );
        return { error: predictionResult.error };
      }

      // 2. Run anomaly detection
      const anomalyResult = await AnomalyDetectionService.detectAnomalies({
        predictionId: predictionResult.prediction.id,
        sensorData,
      });

      if (anomalyResult.error) {
        console.warn(`[AI] Anomaly detection failed:`, anomalyResult.error);
        return { error: anomalyResult.error };
      }

      return {
        prediction: predictionResult.prediction,
        anomalies: anomalyResult.anomalies,
      };
    } catch (error) {
      console.error("[AI] Processing error:", error);
      return { error: "AI_PROCESSING_FAILED" as const };
    }
  }

  /**
   * Get AI insights for a device
   */
  static async getDeviceInsights(deviceId: number, days = 7) {
    const [predictions, anomalySummary] = await Promise.all([
      EnergyPredictionService.getPredictions({
        deviceId,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 50,
      }),
      AnomalyDetectionService.getDeviceAnomalySummary(deviceId, days),
    ]);

    // Calculate prediction accuracy
    const accuratePredictions = predictions.filter(
      (p) =>
        p.actualEnergy !== null &&
        Math.abs(p.predictedEnergy - p.actualEnergy) / p.actualEnergy < 0.2,
    );

    const accuracy =
      predictions.length > 0
        ? accuratePredictions.length / predictions.length
        : 0;

    return {
      predictions: predictions.slice(0, 10), // Latest 10
      anomalySummary,
      modelAccuracy: accuracy,
      insights: {
        totalPredictions: predictions.length,
        avgPredictedEnergy:
          predictions.reduce((sum, p) => sum + p.predictedEnergy, 0) /
            predictions.length || 0,
        anomalyRate: anomalySummary.totalAnomalies / (days * 24), // per hour
      },
    };
  }
}
