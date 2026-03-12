const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Hostify <notifications@apps.rudrax.me>";

export interface ResendEmailPayload {
  to: string | string[];
  subject: string;
  html?: string | undefined;
  text?: string | undefined;
}

export interface ResendEmailResult {
  id?: string;
  status: number;
}

export async function sendResendEmail(
  payload: ResendEmailPayload,
): Promise<ResendEmailResult> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const body = {
    from: RESEND_FROM_EMAIL,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html || (payload.text ? `<p>${payload.text}</p>` : ""),
    text: payload.text,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorText}`);
  }

  const result = (await response.json().catch(() => ({}))) as {
    id?: string;
  };

  return { id: result.id, status: response.status };
}
