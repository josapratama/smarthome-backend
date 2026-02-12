import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../../types/app-env";
import { requireAuth, requireAdmin } from "../../../middlewares/auth";

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

  r.post("/register", handleRegister);
  r.post("/login", handleLogin);
  r.post("/refresh", handleRefresh);
  r.post("/logout", handleLogout);

  r.get("/me", requireAuth, handleMe);
  r.post("/change-password", requireAuth, handleChangePassword);

  r.post("/forgot-password", handleForgotPassword);
  r.post("/reset-password", handleResetPassword);

  r.get("/admin/users", requireAuth, requireAdmin, handleAdminListUsers);

  app.route("/", r); // mount router auth ke app utama
}
