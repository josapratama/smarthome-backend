import { Hono } from "hono";
import { prisma } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

/**
 * GET /api/v1/preferences
 * Get current user preferences
 */
app.get("/", async (c) => {
  const userId = c.get("userId");

  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
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
});

/**
 * PATCH /api/v1/preferences
 * Update user preferences (partial update)
 */
app.patch("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  // Get current preferences
  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
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
});

/**
 * PUT /api/v1/preferences
 * Replace all user preferences
 */
app.put("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const updated = await prisma.userAccount.update({
    where: { id: userId },
    data: { preferences: body },
    select: { preferences: true },
  });

  return c.json({
    data: updated.preferences,
    message: "Preferences replaced successfully",
  });
});

/**
 * DELETE /api/v1/preferences
 * Reset preferences to default
 */
app.delete("/", async (c) => {
  const userId = c.get("userId");

  await prisma.userAccount.update({
    where: { id: userId },
    data: { preferences: null },
  });

  return c.json({
    message: "Preferences reset to default",
  });
});

export default app;
