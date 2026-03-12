import type { DEFAULT_PREFERENCES } from "../services/notifications.js";

export const TYPE_TO_PREF_KEY: Record<
  string,
  keyof typeof DEFAULT_PREFERENCES
> = {
  deploy: "deployEmails",
  security: "securityAlerts",
  digest: "weeklyDigest",
  preview: "previewComments",
};
export type NotificationType = keyof typeof TYPE_TO_PREF_KEY;

export interface TemplateCtx {
  username?: string | undefined;
  details?: string | undefined;
  ctaUrl?: string | undefined;
}

export interface SendUserNotificationInput {
  userId: string;
  type: NotificationType;
  subject?: string | undefined;
  html?: string | undefined;
  text?: string | undefined;
  recipientOverride?: string | undefined;
  templateContext?: TemplateCtx | undefined;
  loggerContext?: Record<string, unknown> | undefined;
}

export interface SendUserNotificationResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  id?: string | undefined;
}
