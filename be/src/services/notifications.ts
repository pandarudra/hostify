import { NotificationSettings } from "../models/NotificationSettings.js";
import { User } from "../models/User.js";
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

const TYPE_TEMPLATES: Record<
  keyof typeof TYPE_TO_PREF_KEY,
  { subject: string; html: (ctx: TemplateCtx) => string; text: string }
> = {
  security: {
    subject: "Security alert: new sign-in detected",
    html: ({ username }) =>
      `<h2>Heads up${username ? ", " + username : ""}!</h2><p>We spotted a sign-in from a new device. If this wasn't you, rotate your tokens and review recent activity.</p><p><strong>What to do:</strong></p><ul><li>Revoke active sessions</li><li>Reset your password on GitHub</li><li>Regenerate Hostify tokens</li></ul>`,
    text: "We spotted a sign-in from a new device. If this wasn't you, revoke sessions, reset your GitHub password, and regenerate Hostify tokens.",
  },
  preview: {
    subject: "Action needed: preview approval required",
    html: ({ username }) =>
      `<h2>Preview approval needed${username ? ", " + username : ""}</h2><p>Production is blocked until this preview is approved. Please review, test, and approve the changes.</p>`,
    text: "Preview approval needed. Production is blocked until this preview is approved. Please review and approve the changes.",
  },
  deploy: {
    subject: "Deployment update",
    html: ({ username }) =>
      `<h2>Deployment update${username ? ", " + username : ""}</h2><p>Your deployment status changed. Check the dashboard for success, failure, or queued jobs.</p>`,
    text: "Deployment status changed. Check the dashboard for success, failure, or queued jobs.",
  },
  digest: {
    subject: "Weekly digest: deploys, traffic, errors",
    html: ({ username }) =>
      `<h2>Your weekly digest${username ? ", " + username : ""}</h2><p>Summary of deployments, traffic, and errors for the past week.</p>`,
    text: "Weekly digest: summary of deployments, traffic, and errors for the past week.",
  },
};

export type NotificationType = keyof typeof TYPE_TO_PREF_KEY;

export interface TemplateCtx {
  username?: string;
  details?: string;
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

export async function sendUserNotification(
  input: SendUserNotificationInput,
): Promise<SendUserNotificationResult> {
  try {
    if (!isDBConnected()) {
      console.warn("notifications:db-not-connected", input.loggerContext);
      return { sent: false, skipped: true, reason: "db-not-connected" };
    }

    const settings = await NotificationSettings.findOne({
      userId: input.userId,
    }).lean();
    const preferences = settings?.preferences || DEFAULT_PREFERENCES;

    const prefKey = TYPE_TO_PREF_KEY[input.type];
    if (prefKey && preferences[prefKey] === false) {
      console.info("notifications:skipped-preference", {
        userId: input.userId,
        type: input.type,
        prefKey,
        ...input.loggerContext,
      });
      return { sent: false, skipped: true, reason: "preference-disabled" };
    }

    const user = await User.findById(input.userId).lean();
    const recipient =
      input.recipientOverride || settings?.notificationEmail || user?.email;

    if (!recipient) {
      console.warn("notifications:no-recipient", {
        userId: input.userId,
        type: input.type,
        ...input.loggerContext,
      });
      return { sent: false, skipped: true, reason: "no-recipient" };
    }

    const template = TYPE_TEMPLATES[input.type];

    const safeTemplateCtx: TemplateCtx = input.templateContext
      ? input.templateContext
      : user?.username
        ? { username: user.username }
        : {};

    const finalSubject = input.subject || template?.subject;
    const finalHtml =
      input.html || (template ? template.html(safeTemplateCtx) : undefined);
    const finalText = input.text || template?.text;

    if (!finalSubject) {
      console.warn("notifications:no-subject", {
        userId: input.userId,
        type: input.type,
        ...input.loggerContext,
      });
      return { sent: false, skipped: true, reason: "no-subject" };
    }

    const result = await sendResendEmail({
      to: recipient,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
    });

    console.info("notifications:sent", {
      userId: input.userId,
      type: input.type,
      recipient,
      id: result.id,
      ...input.loggerContext,
    });

    return { sent: true, id: result.id ?? undefined };
  } catch (error) {
    console.error("notifications:error", {
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
      ...input.loggerContext,
    });
    return { sent: false, reason: "error" };
  }
}
