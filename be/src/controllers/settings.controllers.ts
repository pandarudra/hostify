import type { Response } from "express";
import { NotificationSettings } from "../models/NotificationSettings.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../utils/jwt.js";
import { isDBConnected } from "../config/database.js";

const DEFAULT_PREFERENCES = {
  deployEmails: true,
  securityAlerts: true,
  weeklyDigest: false,
  previewComments: true,
} as const;

const ALLOWED_THEMES = ["light", "dark", "sunset"] as const;

function sanitizePreferences(input: any) {
  return {
    deployEmails:
      typeof input?.deployEmails === "boolean"
        ? input.deployEmails
        : DEFAULT_PREFERENCES.deployEmails,
    securityAlerts:
      typeof input?.securityAlerts === "boolean"
        ? input.securityAlerts
        : DEFAULT_PREFERENCES.securityAlerts,
    weeklyDigest:
      typeof input?.weeklyDigest === "boolean"
        ? input.weeklyDigest
        : DEFAULT_PREFERENCES.weeklyDigest,
    previewComments:
      typeof input?.previewComments === "boolean"
        ? input.previewComments
        : DEFAULT_PREFERENCES.previewComments,
  };
}

export const getSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const userId = req.user.userId;
    let settings = await NotificationSettings.findOne({ userId }).lean();

    if (!settings) {
      const user = await User.findById(userId).lean();
      const seeded = new NotificationSettings({
        userId,
        notificationEmail: user?.email,
        preferences: DEFAULT_PREFERENCES,
      });
      settings = (await seeded.save()).toObject();
    }

    const theme = ALLOWED_THEMES.includes(settings.theme as any)
      ? settings.theme
      : "light";

    return res.status(200).json({
      success: true,
      settings: {
        notificationEmail: settings.notificationEmail,
        preferences: settings.preferences || DEFAULT_PREFERENCES,
        theme,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load settings",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateSettingsOptimistic = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const userId = req.user.userId;
    const existing = await NotificationSettings.findOne({ userId }).lean();

    const mergedPreferences = sanitizePreferences({
      ...(existing?.preferences || {}),
      ...(req.body?.preferences || {}),
    });

    const notificationEmail =
      typeof req.body?.notificationEmail === "string"
        ? req.body.notificationEmail.trim()
        : existing?.notificationEmail;
    const themeCandidate =
      typeof req.body?.theme === "string"
        ? req.body.theme
        : existing?.theme || "light";
    const theme = ALLOWED_THEMES.includes(themeCandidate as any)
      ? themeCandidate
      : existing?.theme || "light";

    const optimisticSettings = {
      notificationEmail,
      preferences: mergedPreferences,
      theme,
    };

    // Respond immediately for optimistic UI updates
    res.status(202).json({
      success: true,
      message: "Settings update scheduled",
      pending: true,
      settings: optimisticSettings,
    });

    // Persist in background to avoid blocking UI
    setImmediate(async () => {
      try {
        await NotificationSettings.findOneAndUpdate(
          { userId },
          {
            $set: {
              ...(notificationEmail !== undefined && { notificationEmail }),
              ...(theme && { theme }),
              preferences: mergedPreferences,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        console.error("Background settings update failed:", error);
      }
    });
  } catch (error) {
    console.error("Update settings error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to update settings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};
