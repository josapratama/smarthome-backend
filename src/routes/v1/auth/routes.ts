import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

import {
  registerRoute,
  loginRoute,
  refreshRoute,
  logoutRoute,
  meRoute,
  changePasswordRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  adminListUsersRoute,
} from "./openapi";

import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
  handleChangePassword,
  handleForgotPassword,
  handleResetPassword,
  handleAdminListUsers,
} from "./handlers";

export function registerAuthRoutes(app: OpenAPIHono<AppEnv>) {
  const r = new OpenAPIHono<AppEnv>();

  // public
  r.openapi(registerRoute, handleRegister);
  r.openapi(loginRoute, handleLogin);
  r.openapi(refreshRoute, handleRefresh);
  r.openapi(logoutRoute, handleLogout);
  r.openapi(forgotPasswordRoute, handleForgotPassword);
  r.openapi(resetPasswordRoute, handleResetPassword);

  // ✅ protected: pakai r.use supaya middleware tidak ikut typing openapi()
  r.use("/me", requireAuth);
  r.openapi(meRoute, handleMe);

  r.use("/change-password", requireAuth);
  r.openapi(changePasswordRoute, handleChangePassword);

  // ✅ admin: chain middleware via r.use
  r.use("/admin/*", requireAuth, requireAdmin);
  r.openapi(adminListUsersRoute, handleAdminListUsers);

  app.route("/", r);
}
