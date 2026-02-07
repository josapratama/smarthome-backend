import { z } from "@hono/zod-openapi";

export const Email = z.email().openapi({ example: "user@example.com" });
export const Username = z.string().min(3).openapi({ example: "temanakun" });
