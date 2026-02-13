import { createRoute, z } from "@hono/zod-openapi";
import {
  LoginBody,
  RegisterBody,
  RefreshBody,
  LogoutBody,
  ChangePasswordBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  AuthLoginResponse,
  AuthRefreshResponse,
  UserDTO,
} from "./schemas";

// 201: Register
export const registerRoute = createRoute({
  method: "post",
  path: "/api/v1/register",
  request: {
    body: { content: { "application/json": { schema: RegisterBody } } },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              user: UserDTO,
              home: z.any().nullable(),
            }),
          }),
        },
      },
      description: "Register user.",
    },

    409: { description: "Conflict (e.g. username/email exists)" },
  },
  tags: ["Auth"],
});
export type RegisterRoute = typeof registerRoute;

// 200: Login
export const loginRoute = createRoute({
  method: "post",
  path: "/api/v1/login",
  request: {
    body: { content: { "application/json": { schema: LoginBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthLoginResponse } },
      description: "Login.",
    },
    401: { description: "Invalid credentials" },
  },
  tags: ["Auth"],
});
export type LoginRoute = typeof loginRoute;

// 200: Refresh
export const refreshRoute = createRoute({
  method: "post",
  path: "/api/v1/refresh",
  request: {
    body: { content: { "application/json": { schema: RefreshBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthRefreshResponse } },
      description: "Refresh access token.",
    },
    401: { description: "Invalid refresh token/session" },
  },
  tags: ["Auth"],
});
export type RefreshRoute = typeof refreshRoute;

// 200: Logout
export const logoutRoute = createRoute({
  method: "post",
  path: "/api/v1/logout",
  request: {
    body: { content: { "application/json": { schema: LogoutBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Logout (invalidate session).",
    },
  },
  tags: ["Auth"],
});
export type LogoutRoute = typeof logoutRoute;

// 200: Me
export const meRoute = createRoute({
  method: "get",
  path: "/api/v1/me",
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: UserDTO }) } },
      description: "Get current user.",
    },
    404: { description: "User not found" },
    401: { description: "Unauthorized" },
  },
  tags: ["Auth"],
});
export type MeRoute = typeof meRoute;

// 200: Change Password
export const changePasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/change-password",
  request: {
    body: { content: { "application/json": { schema: ChangePasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Change password.",
    },
    400: { description: "Bad request" },
    401: { description: "Unauthorized" },
  },
  tags: ["Auth"],
});
export type ChangePasswordRoute = typeof changePasswordRoute;

// 200: Forgot Password
export const forgotPasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/forgot-password",
  request: {
    body: { content: { "application/json": { schema: ForgotPasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Request password reset (token/email flow).",
    },
  },
  tags: ["Auth"],
});
export type ForgotPasswordRoute = typeof forgotPasswordRoute;

// 200: Reset Password
export const resetPasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/reset-password",
  request: {
    body: { content: { "application/json": { schema: ResetPasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Reset password with token.",
    },
    400: { description: "Invalid token / bad request" },
  },
  tags: ["Auth"],
});
export type ResetPasswordRoute = typeof resetPasswordRoute;

// 200: Admin list users (query param limit)
export const adminListUsersRoute = createRoute({
  method: "get",
  path: "/api/v1/admin/users",
  request: {
    query: z.object({
      limit: z.string().optional().openapi({ example: "50" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ data: z.array(UserDTO) }) },
      },
      description: "Admin list users.",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
  tags: ["Auth"],
});
export type AdminListUsersRoute = typeof adminListUsersRoute;
