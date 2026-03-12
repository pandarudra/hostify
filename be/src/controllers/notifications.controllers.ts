import type { Response } from "express";
import type { AuthRequest } from "../utils/jwt.js";
import {
  sendUserNotification,
  type NotificationType,
} from "../services/notifications.js";

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
    const { subject, html, text, to, type } = req.body || {};

    const result = await sendUserNotification({
      userId: req.user.userId,
      type: (type as NotificationType) || "deploy",
      subject,
      html,
      text,
      recipientOverride: typeof to === "string" ? to : undefined,
      loggerContext: { source: "api" },
    });

    console.log(result);

    return res.status(result.sent ? 200 : 202).json({
      success: result.sent,
      skipped: result.skipped,
      reason: result.reason,
      message: result.sent
        ? "Notification email sent via Resend"
        : result.reason || "Notification skipped",
      id: result.id,
      template: type ?? null,
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
