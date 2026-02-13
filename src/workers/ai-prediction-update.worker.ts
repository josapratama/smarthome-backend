import { prisma } from "../lib/prisma";
import { EnergyPredictionService } from "../services/ai/ai.service";

/**
 * AI Prediction Update Worker
 *
 * This worker runs periodically to:
 * 1. Find predictions that have ended but don't have actual energy values
 * 2. Calculate actual energy consumption from sensor data
 * 3. Update predictions with actual values for model accuracy tracking
 */

export async function runAIPredictionUpdateWorker() {
  console.log("[AI Worker] Starting prediction update worker...");

  try {
    // Find predictions that have ended but don't have actual energy
    const outdatedPredictions = await prisma.energyPrediction.findMany({
      where: {
        windowEnd: { lte: new Date() }, // Prediction window has ended
        actualEnergy: null, // No actual energy recorded yet
      },
      include: {
        device: {
          select: { id: true, deviceName: true },
        },
      },
      take: 50, // Process in batches
    });

    console.log(
      `[AI Worker] Found ${outdatedPredictions.length} predictions to update`,
    );

    for (const prediction of outdatedPredictions) {
      try {
        // Calculate actual energy consumption during the prediction window
        const actualEnergy = await calculateActualEnergyConsumption(
          prediction.deviceId,
          prediction.windowStart!,
          prediction.windowEnd!,
        );

        if (actualEnergy !== null) {
          // Update prediction with actual energy
          const result = await EnergyPredictionService.updateWithActual(
            prediction.id,
            actualEnergy,
          );

          if (!result.error) {
            console.log(
              `[AI Worker] Updated prediction ${prediction.id} for device ${prediction.device.deviceName}: ` +
                `predicted=${prediction.predictedEnergy.toFixed(3)}kWh, actual=${actualEnergy.toFixed(3)}kWh, ` +
                `accuracy=${result.accuracy.toFixed(2)}`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[AI Worker] Failed to update prediction ${prediction.id}:`,
          error,
        );
      }
    }

    // Clean up old predictions (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedCount = await prisma.energyPrediction.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    if (deletedCount.count > 0) {
      console.log(
        `[AI Worker] Cleaned up ${deletedCount.count} old predictions`,
      );
    }

    console.log("[AI Worker] Prediction update worker completed successfully");
  } catch (error) {
    console.error("[AI Worker] Prediction update worker failed:", error);
  }
}

/**
 * Calculate actual energy consumption during a time window
 */
async function calculateActualEnergyConsumption(
  deviceId: number,
  windowStart: Date,
  windowEnd: Date,
): Promise<number | null> {
  // Get all sensor readings during the prediction window
  const sensorData = await prisma.sensorData.findMany({
    where: {
      deviceId,
      timestamp: {
        gte: windowStart,
        lte: windowEnd,
      },
      powerW: { not: null },
    },
    orderBy: { timestamp: "asc" },
    select: {
      powerW: true,
      timestamp: true,
    },
  });

  if (sensorData.length < 2) {
    console.warn(
      `[AI Worker] Insufficient data for device ${deviceId} in window ${windowStart.toISOString()} - ${windowEnd.toISOString()}`,
    );
    return null;
  }

  // Calculate energy consumption using trapezoidal integration
  let totalEnergy = 0;

  for (let i = 1; i < sensorData.length; i++) {
    const prev = sensorData[i - 1];
    const curr = sensorData[i];

    if (prev.powerW !== null && curr.powerW !== null) {
      // Time difference in hours
      const timeDiffHours =
        (curr.timestamp.getTime() - prev.timestamp.getTime()) /
        (1000 * 60 * 60);

      // Average power during this interval
      const avgPower = (prev.powerW + curr.powerW) / 2;

      // Energy = Power × Time
      totalEnergy += (avgPower * timeDiffHours) / 1000; // Convert to kWh
    }
  }

  return totalEnergy;
}

/**
 * Start the AI prediction update worker with periodic execution
 */
export function startAIPredictionUpdateWorker(intervalMinutes = 60) {
  console.log(
    `[AI Worker] Starting prediction update worker with ${intervalMinutes}min interval`,
  );

  // Run immediately
  runAIPredictionUpdateWorker();

  // Then run periodically
  setInterval(
    () => {
      runAIPredictionUpdateWorker();
    },
    intervalMinutes * 60 * 1000,
  );
}

/**
 * Generate daily energy predictions for all active devices
 */
export async function generateDailyPredictions() {
  console.log("[AI Worker] Generating daily predictions for all devices...");

  try {
    // Get all active devices with power monitoring capability
    const devices = await prisma.device.findMany({
      where: {
        deletedAt: null,
        status: true, // Only active devices
      },
      include: {
        sensorData: {
          where: {
            powerW: { not: null },
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          },
          take: 1,
        },
      },
    });

    const devicesWithPower = devices.filter(
      (d: any) => d.sensorData.length > 0,
    );
    console.log(
      `[AI Worker] Found ${devicesWithPower.length} devices with power monitoring`,
    );

    for (const device of devicesWithPower) {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Check if prediction already exists for tomorrow
        const existingPrediction = await prisma.energyPrediction.findFirst({
          where: {
            deviceId: device.id,
            windowStart: {
              gte: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
              ),
              lt: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 2,
              ),
            },
          },
        });

        if (!existingPrediction) {
          const result = await EnergyPredictionService.generatePrediction({
            deviceId: device.id,
            windowStart: new Date(
              tomorrow.getFullYear(),
              tomorrow.getMonth(),
              tomorrow.getDate(),
            ),
            windowEnd: new Date(
              tomorrow.getFullYear(),
              tomorrow.getMonth(),
              tomorrow.getDate() + 1,
            ),
          });

          if (!result.error) {
            console.log(
              `[AI Worker] Generated prediction for device ${device.deviceName}: ${result.prediction.predictedEnergy.toFixed(3)}kWh`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[AI Worker] Failed to generate prediction for device ${device.id}:`,
          error,
        );
      }
    }

    console.log("[AI Worker] Daily prediction generation completed");
  } catch (error) {
    console.error("[AI Worker] Daily prediction generation failed:", error);
  }
}

/**
 * Start daily prediction generation (runs at midnight)
 */
export function startDailyPredictionWorker() {
  console.log("[AI Worker] Starting daily prediction worker");

  const scheduleNextRun = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // Run at 00:05 AM

    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      generateDailyPredictions();
      scheduleNextRun(); // Schedule next run
    }, msUntilTomorrow);

    console.log(
      `[AI Worker] Next daily prediction run scheduled for ${tomorrow.toISOString()}`,
    );
  };

  scheduleNextRun();
}
