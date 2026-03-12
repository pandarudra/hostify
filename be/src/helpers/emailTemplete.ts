type TemplateParts = {
  title: string;
  subtitle?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function renderShell(parts: TemplateParts): string {
  const {
    title,
    subtitle,
    body,
    ctaLabel = "Open Dashboard",
    ctaUrl = "https://hostify.app",
    footerNote = "You are receiving this because notifications are enabled in your Hostify settings.",
  } = parts;

  // Inline styles for broad client support
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 35px rgba(15,23,42,0.08);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:20px 24px;color:#fff;font-weight:700;font-size:18px;letter-spacing:0.2px;">
              Hostify
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">${title}</h1>
              ${subtitle ? `<p style="margin:0 0 16px;font-size:15px;color:#475569;">${subtitle}</p>` : ""}
              <div style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#0f172a;">${body}</div>
              ${
                ctaLabel && ctaUrl
                  ? `<a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">${ctaLabel}</a>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
              ${footerNote}
              <br/>Manage preferences in Settings → Notifications.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const securityEmailTemplate = ({
  username,
  details,
  ctaUrl,
}: {
  username?: string;
  details?: string;
  ctaUrl?: string;
}) =>
  renderShell({
    title: `New sign-in detected${username ? ", " + username : ""}`,
    subtitle: "We noticed a login from a new device or location.",
    body: `<p style="margin:0 0 12px;">If this was you, no action is needed. If not, please secure your account immediately.</p>
      <ul style="padding-left:18px;margin:0 0 16px;color:#0f172a;">
        <li>Revoke active sessions</li>
        <li>Rotate your Hostify tokens</li>
        <li>Reset your GitHub password</li>
      </ul>
      ${details ? `<p style="margin:0;">Details: ${details}</p>` : ""}`,
    ctaLabel: "Review sessions",
    ctaUrl: ctaUrl || "https://hostify.app/settings",
  });

export const previewEmailTemplate = ({
  username,
  details,
  ctaUrl,
}: {
  username?: string;
  details?: string;
  ctaUrl?: string;
}) =>
  renderShell({
    title: "Preview approval required",
    subtitle: `Production is blocked until this preview is approved${username ? ", " + username : ""}.`,
    body: `<p style="margin:0 0 12px;">Please review the preview build, add comments, and approve to unblock production deploys.</p>
      ${details ? `<p style="margin:0;">${details}</p>` : ""}`,
    ctaLabel: "Open preview",
    ctaUrl: ctaUrl || "https://hostify.app/dash",
  });

export const deployEmailTemplate = ({
  username,
  details,
  ctaUrl,
}: {
  username?: string;
  details?: string;
  ctaUrl?: string;
}) =>
  renderShell({
    title: `Deployment update${username ? ", " + username : ""}`,
    subtitle: "Your deployment status just changed.",
    body: `<p style="margin:0 0 12px;">Check the dashboard for the latest logs and preview links.</p>
      ${details ? `<p style="margin:0;">${details}</p>` : ""}`,
    ctaLabel: "View deployment",
    ctaUrl: ctaUrl || "https://hostify.app/dash",
  });

export const digestEmailTemplate = ({
  username,
  details,
  ctaUrl,
}: {
  username?: string;
  details?: string;
  ctaUrl?: string;
}) =>
  renderShell({
    title: `Weekly digest${username ? ", " + username : ""}`,
    subtitle:
      "A concise summary of deploys, traffic, and errors from the past week.",
    body: `<p style="margin:0 0 12px;">Highlights and notable events are included below.</p>
      ${details ? `<p style="margin:0;">${details}</p>` : ""}`,
    ctaLabel: "Open dashboard",
    ctaUrl: ctaUrl || "https://hostify.app/dash",
  });
