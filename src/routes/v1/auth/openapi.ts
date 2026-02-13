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

// User Registration
export const registerRoute = createRoute({
  method: "post",
  path: "/api/v1/register",
  summary: "Register new user account",
  description:
    "Create a new user account with username, email, and password. Returns user data and associated home if any.",
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
      description: "User registered successfully",
    },
    409: { description: "Conflict - username or email already exists" },
  },
  tags: ["Authentication"],
});
export type RegisterRoute = typeof registerRoute;

// User Login
export const loginRoute = createRoute({
  method: "post",
  path: "/api/v1/login",
  summary: "User login",
  description:
    "Authenticate user with username/email and password. Returns access token and refresh token.",
  request: {
    body: { content: { "application/json": { schema: LoginBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthLoginResponse } },
      description: "Login successful",
    },
    401: { description: "Invalid credentials" },
  },
  tags: ["Authentication"],
});
export type LoginRoute = typeof loginRoute;

// Token Refresh
export const refreshRoute = createRoute({
  method: "post",
  path: "/api/v1/refresh",
  summary: "Refresh access token",
  description:
    "Generate new access token using valid refresh token. Extends user session.",
  request: {
    body: { content: { "application/json": { schema: RefreshBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthRefreshResponse } },
      description: "Token refreshed successfully",
    },
    401: { description: "Invalid or expired refresh token" },
  },
  tags: ["Authentication"],
});
export type RefreshRoute = typeof refreshRoute;

// User Logout
export const logoutRoute = createRoute({
  method: "post",
  path: "/api/v1/logout",
  summary: "User logout",
  description:
    "Invalidate user session and refresh token. Logs out the user from the current session.",
  request: {
    body: { content: { "application/json": { schema: LogoutBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Logout successful",
    },
  },
  tags: ["Authentication"],
});
export type LogoutRoute = typeof logoutRoute;

// Get Current User
export const meRoute = createRoute({
  method: "get",
  path: "/api/v1/me",
  summary: "Get current user profile",
  description:
    "Retrieve the profile information of the currently authenticated user.",
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: UserDTO }) } },
      description: "User profile retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    404: { description: "User not found" },
  },
  tags: ["User Profile"],
});
export type MeRoute = typeof meRoute;

// Change Password
export const changePasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/change-password",
  summary: "Change user password",
  description:
    "Change the password for the currently authenticated user. Requires current password for verification.",
  request: {
    body: { content: { "application/json": { schema: ChangePasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Password changed successfully",
    },
    400: {
      description:
        "Bad request - invalid current password or new password format",
    },
    401: { description: "Unauthorized - invalid or missing token" },
  },
  tags: ["User Profile"],
});
export type ChangePasswordRoute = typeof changePasswordRoute;

// Forgot Password
export const forgotPasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/forgot-password",
  summary: "Request password reset",
  description:
    "Initiate password reset process by sending reset token to user's email address.",
  request: {
    body: { content: { "application/json": { schema: ForgotPasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Password reset email sent successfully",
    },
  },
  tags: ["Authentication"],
});
export type ForgotPasswordRoute = typeof forgotPasswordRoute;

// Reset Password
export const resetPasswordRoute = createRoute({
  method: "post",
  path: "/api/v1/reset-password",
  summary: "Reset password with token",
  description:
    "Complete password reset process using the token received via email and set new password.",
  request: {
    body: { content: { "application/json": { schema: ResetPasswordBody } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ data: z.any() }) } },
      description: "Password reset successfully",
    },
    400: { description: "Invalid or expired reset token" },
  },
  tags: ["Authentication"],
});
export type ResetPasswordRoute = typeof resetPasswordRoute;

// Admin: List Users
export const adminListUsersRoute = createRoute({
  method: "get",
  path: "/api/v1/admin/users",
  summary: "List all users (Admin only)",
  description:
    "Retrieve a list of all registered users. Requires admin privileges. Supports pagination with limit parameter.",
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
      description: "Users retrieved successfully",
    },
    401: { description: "Unauthorized - invalid or missing token" },
    403: { description: "Forbidden - admin privileges required" },
  },
  tags: ["Admin"],
});
export type AdminListUsersRoute = typeof adminListUsersRoute;
