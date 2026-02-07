import { z } from "@hono/zod-openapi";
import { Email, Username } from "../common/schemas";
import { UserId, HomeId } from "../common/ids";

export const RegisterBody = z
  .object({
    username: Username,
    email: Email,
    password: z.string().min(8).openapi({ example: "password-kuat-123" }),
    role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
    homeName: z.string().min(1).optional().openapi({ example: "Rumah Utama" }),
  })
  .openapi("RegisterBody");

export const LoginBody = z
  .object({
    identifier: z.string().min(3).openapi({ example: "user@example.com" }),
    password: z.string().min(1).openapi({ example: "password-kuat-123" }),
  })
  .openapi("LoginBody");

export const UserDTO = z
  .object({
    id: UserId,
    username: z.string(),
    email: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.string(),
  })
  .openapi("UserDTO");

export const HomeDTO = z
  .object({
    id: HomeId,
    name: z.string(),
    ownerId: UserId,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("HomeDTO");
