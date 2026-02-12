import { z } from "@hono/zod-openapi";

export const UserId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const HomeId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const DeviceId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const SensorId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const CommandId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const PredictionId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
export const EndpointId = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 1 });
