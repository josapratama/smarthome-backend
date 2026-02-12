// src/routes/v1/auth/schemas.ts
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
    username: Username,
    password: z.string().min(1).openapi({ example: "password-kuat-123" }),
  })
  .openapi("LoginBody");

export const RefreshBody = z
  .object({
    sessionId: z.number().int().positive(),
    refreshToken: z.string().min(10),
  })
  .openapi("RefreshBody");

export const LogoutBody = z
  .object({
    sessionId: z.number().int().positive(),
  })
  .openapi("LogoutBody");

export const ChangePasswordBody = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .openapi("ChangePasswordBody");

export const ForgotPasswordBody = z
  .object({
    username: Username,
  })
  .openapi("ForgotPasswordBody");

export const ResetPasswordBody = z
  .object({
    token: z.string().min(10),
    newPassword: z.string().min(8),
  })
  .openapi("ResetPasswordBody");

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
    ownerUserId: UserId, // ✅ sesuai schema baru
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("HomeDTO");

export const AuthLoginResponse = z
  .object({
    data: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      sessionId: z.number(),
      user: UserDTO,
    }),
  })
  .openapi("AuthLoginResponse");

export const AuthRefreshResponse = z
  .object({
    data: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      sessionId: z.number(),
      user: UserDTO,
    }),
  })
  .openapi("AuthRefreshResponse");
