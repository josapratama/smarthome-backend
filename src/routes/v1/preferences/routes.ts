import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import type { AppEnv } from "../../../types/app-env";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../middlewares/auth";

const PreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sound: z.boolean().optional(),
    })
    .optional(),
  timezone: z.string().optional(),
});

const ErrorSchema = z.object({
  error: z.string(),
});

const SuccessDataSchema = z.object({
  data: z.any(),
});

const SuccessMessageSchema = z.object({
  data: z.any(),
  message: z.string(),
});

const MessageOnlySchema = z.object({
  message: z.string(),
});

export function registerPreferencesRoutes(app: OpenAPIHono<AppEnv>) {
  const preferences = new OpenAPIHono<AppEnv>();

  // Apply auth middleware
  preferences.use("*", requireAuth);

  /**
   * GET /api/v1/preferences
   * Get current user preferences
   */
  preferences.openapi(
    {
      method: "get",
      path: "/api/v1/preferences",
      tags: ["Preferences"],
      summary: "Get user preferences",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "User preferences",
          content: {
            "application/json": {
              schema: SuccessDataSchema,
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
      },
    },
    async (c) => {
      const auth = c.get("auth");
      const userId = auth?.user?.id;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401) as any;
      }

      const user = await prisma.userAccount.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404) as any;
      }

      // Default preferences if not set
      const defaultPreferences = {
        theme: "light",
        language: "en",
        notifications: {
          email: true,
          push: true,
          sound: true,
        },
        timezone: "UTC",
      };

      return c.json({
        data: user.preferences || defaultPreferences,
      });
    },
  );

  /**
   * PATCH /api/v1/preferences
   * Update user preferences (partial update)
   */
  preferences.openapi(
    {
      method: "patch",
      path: "/api/v1/preferences",
      tags: ["Preferences"],
      summary: "Update user preferences",
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: PreferencesSchema.partial(),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Preferences updated",
          content: {
            "application/json": {
              schema: SuccessMessageSchema,
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
      },
    },
    async (c) => {
      const auth = c.get("auth");
      const userId = auth?.user?.id;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401) as any;
      }

      const body = c.req.valid("json");

      // Get current preferences
      const user = await prisma.userAccount.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404) as any;
      }

      // Merge with existing preferences
      const currentPrefs = (user.preferences as any) || {};
      const updatedPrefs = {
        ...currentPrefs,
        ...body,
      };

      // Update in database
      const updated = await prisma.userAccount.update({
        where: { id: userId },
        data: { preferences: updatedPrefs },
        select: { preferences: true },
      });

      return c.json({
        data: updated.preferences,
        message: "Preferences updated successfully",
      });
    },
  );

  /**
   * PUT /api/v1/preferences
   * Replace all user preferences
   */
  preferences.openapi(
    {
      method: "put",
      path: "/api/v1/preferences",
      tags: ["Preferences"],
      summary: "Replace user preferences",
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: PreferencesSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Preferences replaced",
          content: {
            "application/json": {
              schema: SuccessMessageSchema,
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
      },
    },
    async (c) => {
      const auth = c.get("auth");
      const userId = auth?.user?.id;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401) as any;
      }

      const body = c.req.valid("json");

      const updated = await prisma.userAccount.update({
        where: { id: userId },
        data: { preferences: body },
        select: { preferences: true },
      });

      return c.json({
        data: updated.preferences,
        message: "Preferences replaced successfully",
      });
    },
  );

  /**
   * DELETE /api/v1/preferences
   * Reset preferences to default
   */
  preferences.openapi(
    {
      method: "delete",
      path: "/api/v1/preferences",
      tags: ["Preferences"],
      summary: "Reset preferences to default",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Preferences reset",
          content: {
            "application/json": {
              schema: MessageOnlySchema,
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
        },
      },
    },
    async (c) => {
      const auth = c.get("auth");
      const userId = auth?.user?.id;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401) as any;
      }

      await prisma.userAccount.update({
        where: { id: userId },
        data: { preferences: {} as any },
      });

      return c.json({
        message: "Preferences reset to default",
      });
    },
  );

  app.route("/", preferences);
}
