import type { Response } from "express";
import { NotificationSettings } from "../models/NotificationSettings.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../utils/jwt.js";
import { isDBConnected } from "../config/database.js";
import { TwoFactorChallenge } from "../models/TwoFactorChallenge.js";
import { sendResendEmail } from "../utils/resend.js";
import { createHash } from "node:crypto";

const DEFAULT_PREFERENCES = {
  deployEmails: true,
  securityAlerts: true,
  weeklyDigest: false,
  previewComments: true,
} as const;

const ALLOWED_THEMES = ["light", "dark", "sunset"] as const;

const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

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
    let user = null as any;
    let settings = await NotificationSettings.findOne({ userId }).lean();

    if (!settings) {
      user = await User.findById(userId).lean();
      const seeded = new NotificationSettings({
        userId,
        notificationEmail: user?.email,
        preferences: DEFAULT_PREFERENCES,
      });
      settings = (await seeded.save()).toObject();
    } else if (!settings.notificationEmail) {
      user = await User.findById(userId).lean();
    }

    const theme = ALLOWED_THEMES.includes(settings.theme as any)
      ? settings.theme
      : "light";
    const preferences = sanitizePreferences(settings.preferences || {});
    const notificationEmail =
      settings.notificationEmail || user?.email || undefined;

    const twoFactor = await User.findById(userId)
      .select("twoFactorEnabled twoFactorEmail")
      .lean();

    return res.status(200).json({
      success: true,
      settings: {
        notificationEmail,
        preferences,
        theme,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        twoFactorEnabled: !!twoFactor?.twoFactorEnabled,
        twoFactorEmail: twoFactor?.twoFactorEmail,
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

export const initiateTwoFactorSetup = async (
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
    const requestedEmail = (req.body?.email || "").trim();
    const user = await User.findById(userId).lean();
    const settings = await NotificationSettings.findOne({ userId }).lean();

    const destination =
      requestedEmail || settings?.notificationEmail || user?.email;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "No email available to send the code. Add an email first.",
      });
    }

    const code = generateOtp();
    await TwoFactorChallenge.deleteMany({ userId, purpose: "enable" });
    await TwoFactorChallenge.create({
      userId,
      purpose: "enable",
      destination,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    await sendResendEmail({
      to: destination,
      subject: "Verify your email to enable 2FA",
      text: `Your Hostify verification code is ${code}. It expires in 10 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent. Enter it to finish enabling 2FA.",
      destination,
    });
  } catch (error) {
    console.error("Initiate 2FA setup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const verifyTwoFactorSetup = async (
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

    const code = (req.body?.code || "").toString().trim();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const challenge = await TwoFactorChallenge.findOne({
      userId: req.user.userId,
      purpose: "enable",
      consumed: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "No active verification code. Please request a new one.",
      });
    }

    if (challenge.codeHash !== hashCode(code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    await TwoFactorChallenge.updateOne(
      { _id: challenge._id },
      { $set: { consumed: true } },
    );

    await User.updateOne(
      { _id: req.user.userId },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorEmail: challenge.destination,
          twoFactorEnabledAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Two-factor authentication enabled.",
      twoFactorEmail: challenge.destination,
    });
  } catch (error) {
    console.error("Verify 2FA setup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const disableTwoFactor = async (
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

    await User.updateOne(
      { _id: req.user.userId },
      {
        $set: { twoFactorEnabled: false },
        $unset: { twoFactorEmail: "", twoFactorEnabledAt: "" },
      },
    );

    await TwoFactorChallenge.deleteMany({ userId: req.user.userId });

    return res
      .status(200)
      .json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disable two-factor authentication",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
