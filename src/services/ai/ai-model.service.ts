import { prisma } from "../../lib/prisma";

export type AIModelInput = {
  name: string;
  version: string;
  algorithm: "moving_average" | "linear_regression" | "seasonal_decomposition";
  parameters: Record<string, any>;
  description?: string;
};

export type AIModelPerformanceInput = {
  modelName: string;
  deviceId: number;
  accuracy: number;
  predictionDate: Date;
};

export class AIModelService {
  /**
   * Create a new AI model
   */
  static async createModel(input: AIModelInput) {
    // Check if model with same name already exists
    const existingModel = await prisma.aIModel.findUnique({
      where: { name: input.name },
    });

    if (existingModel) {
      return { error: "MODEL_ALREADY_EXISTS" as const };
    }

    const model = await prisma.aIModel.create({
      data: {
        name: input.name,
        version: input.version,
        algorithm: input.algorithm,
        parameters: input.parameters,
        description: input.description,
        isActive: false, // New models start inactive
      },
    });

    return { model };
  }

  /**
   * Get all AI models
   */
  static async getModels(params?: {
    isActive?: boolean;
    algorithm?: string;
    limit?: number;
  }) {
    return prisma.aIModel.findMany({
      where: {
        isActive: params?.isActive,
        algorithm: params?.algorithm,
      },
      orderBy: [
        { isActive: "desc" },
        { avgAccuracy: "desc" },
        { createdAt: "desc" },
      ],
      take: params?.limit || 50,
    });
  }

  /**
   * Get model by name
   */
  static async getModelByName(name: string) {
    const model = await prisma.aIModel.findUnique({
      where: { name },
    });

    if (!model) {
      return { error: "MODEL_NOT_FOUND" as const };
    }

    return { model };
  }

  /**
   * Update model
   */
  static async updateModel(
    name: string,
    updates: Partial<AIModelInput> & { isActive?: boolean },
  ) {
    const model = await prisma.aIModel.findUnique({
      where: { name },
    });

    if (!model) {
      return { error: "MODEL_NOT_FOUND" as const };
    }

    const updatedModel = await prisma.aIModel.update({
      where: { name },
      data: {
        version: updates.version,
        algorithm: updates.algorithm,
        parameters: updates.parameters,
        description: updates.description,
        isActive: updates.isActive,
      },
    });

    return { model: updatedModel };
  }

  /**
   * Activate a model (deactivates others of same algorithm)
   */
  static async activateModel(name: string) {
    const model = await prisma.aIModel.findUnique({
      where: { name },
    });

    if (!model) {
      return { error: "MODEL_NOT_FOUND" as const };
    }

    // Deactivate other models of the same algorithm
    await prisma.aIModel.updateMany({
      where: {
        algorithm: model.algorithm,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Activate the selected model
    const activatedModel = await prisma.aIModel.update({
      where: { name },
      data: { isActive: true },
    });

    return { model: activatedModel };
  }

  /**
   * Delete a model
   */
  static async deleteModel(name: string) {
    const model = await prisma.aIModel.findUnique({
      where: { name },
    });

    if (!model) {
      return { error: "MODEL_NOT_FOUND" as const };
    }

    if (model.isActive) {
      return { error: "CANNOT_DELETE_ACTIVE_MODEL" as const };
    }

    await prisma.aIModel.delete({
      where: { name },
    });

    return { success: true };
  }

  /**
   * Get active model for algorithm
   */
  static async getActiveModel(algorithm: string) {
    const model = await prisma.aIModel.findFirst({
      where: {
        algorithm,
        isActive: true,
      },
    });

    if (!model) {
      return { error: "NO_ACTIVE_MODEL" as const };
    }

    return { model };
  }

  /**
   * Record model performance
   */
  static async recordPerformance(input: AIModelPerformanceInput) {
    const performance = await prisma.aIModelPerformance.create({
      data: {
        modelName: input.modelName,
        deviceId: input.deviceId,
        accuracy: input.accuracy,
        predictionDate: input.predictionDate,
      },
    });

    // Update model's average accuracy and total predictions
    await this.updateModelStats(input.modelName);

    return { performance };
  }

  /**
   * Get model performance history
   */
  static async getModelPerformance(params: {
    modelName?: string;
    deviceId?: number;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    return prisma.aIModelPerformance.findMany({
      where: {
        modelName: params.modelName,
        deviceId: params.deviceId,
        recordedAt: {
          gte: params.from,
          lte: params.to,
        },
      },
      include: {
        device: {
          select: {
            id: true,
            deviceName: true,
            deviceType: true,
          },
        },
      },
      orderBy: { recordedAt: "desc" },
      take: params.limit || 100,
    });
  }

  /**
   * Get model comparison
   */
  static async compareModels(params: {
    algorithms?: string[];
    deviceId?: number;
    days?: number;
  }) {
    const since = new Date(
      Date.now() - (params.days || 30) * 24 * 60 * 60 * 1000,
    );

    const performances = await prisma.aIModelPerformance.findMany({
      where: {
        deviceId: params.deviceId,
        recordedAt: { gte: since },
      },
      include: {
        device: {
          select: {
            id: true,
            deviceName: true,
          },
        },
      },
    });

    // Group by model name and calculate stats
    const modelStats = performances.reduce(
      (acc: Record<string, any>, perf: any) => {
        if (!acc[perf.modelName]) {
          acc[perf.modelName] = {
            modelName: perf.modelName,
            totalPredictions: 0,
            totalAccuracy: 0,
            avgAccuracy: 0,
            minAccuracy: 1,
            maxAccuracy: 0,
            predictions: [],
          };
        }

        const stats = acc[perf.modelName];
        stats.totalPredictions++;
        stats.totalAccuracy += perf.accuracy;
        stats.minAccuracy = Math.min(stats.minAccuracy, perf.accuracy);
        stats.maxAccuracy = Math.max(stats.maxAccuracy, perf.accuracy);
        stats.predictions.push(perf);

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate averages
    Object.values(modelStats).forEach((stats: any) => {
      stats.avgAccuracy = stats.totalAccuracy / stats.totalPredictions;
    });

    return Object.values(modelStats);
  }

  /**
   * Get best performing model for device
   */
  static async getBestModelForDevice(deviceId: number, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const bestModel = await prisma.aIModelPerformance.groupBy({
      by: ["modelName"],
      where: {
        deviceId,
        recordedAt: { gte: since },
      },
      _avg: {
        accuracy: true,
      },
      _count: {
        accuracy: true,
      },
      having: {
        accuracy: {
          _count: {
            gte: 5, // Minimum 5 predictions for reliability
          },
        },
      },
      orderBy: {
        _avg: {
          accuracy: "desc",
        },
      },
      take: 1,
    });

    if (bestModel.length === 0) {
      return { error: "NO_PERFORMANCE_DATA" as const };
    }

    const modelName = bestModel[0].modelName;
    const model = await prisma.aIModel.findUnique({
      where: { name: modelName },
    });

    return {
      model,
      avgAccuracy: bestModel[0]._avg.accuracy,
      totalPredictions: bestModel[0]._count.accuracy,
    };
  }

  // ===== PRIVATE METHODS =====

  private static async updateModelStats(modelName: string) {
    const stats = await prisma.aIModelPerformance.aggregate({
      where: { modelName },
      _avg: { accuracy: true },
      _count: { accuracy: true },
    });

    if (stats._count.accuracy > 0) {
      await prisma.aIModel.update({
        where: { name: modelName },
        data: {
          avgAccuracy: stats._avg.accuracy || 0,
          totalPredictions: stats._count.accuracy,
        },
      });
    }
  }
}
