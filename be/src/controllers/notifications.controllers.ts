import type { Response } from "express";
import { NotificationSettings } from "../models/NotificationSettings.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../utils/jwt.js";
import { isDBConnected } from "../config/database.js";
import { sendResendEmail } from "../utils/resend.js";

const DEFAULT_PREFERENCES = {
  deployEmails: true,
  securityAlerts: true,
  weeklyDigest: false,
  previewComments: true,
} as const;

const TYPE_TO_PREF_KEY: Record<string, keyof typeof DEFAULT_PREFERENCES> = {
  deploy: "deployEmails",
  security: "securityAlerts",
  digest: "weeklyDigest",
  preview: "previewComments",
};

export const sendNotificationEmail = async (
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

    const { subject, html, text, to, type } = req.body || {};

    if (!subject || typeof subject !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });
    }

    const userId = req.user.userId;
    const settings = await NotificationSettings.findOne({ userId }).lean();
    const preferences = settings?.preferences || DEFAULT_PREFERENCES;

    if (type && TYPE_TO_PREF_KEY[type]) {
      const key = TYPE_TO_PREF_KEY[type];
      if (preferences[key] === false) {
        return res.status(202).json({
          success: true,
          skipped: true,
          message: `Notification skipped because ${key} preference is disabled`,
        });
      }
    }

    const user = await User.findById(userId).lean();
    const recipient =
      typeof to === "string" && to.length > 0
        ? to
        : settings?.notificationEmail || user?.email;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: "No recipient email available",
      });
    }

    await sendResendEmail({ to: recipient, subject, html, text });

    return res.status(200).json({
      success: true,
      message: "Notification email sent via Resend",
    });
  } catch (error) {
    console.error("Send notification email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification email",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
