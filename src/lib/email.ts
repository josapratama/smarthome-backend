import { env } from "./env";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email not configured: set RESEND_API_KEY and EMAIL_FROM");
  }
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new EmailNotConfiguredError();
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RESEND_FAILED: ${res.status} ${body}`);
  }

  return { ok: true as const };
}
