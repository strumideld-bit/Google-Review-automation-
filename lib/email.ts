import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { to, subject, text } = params;
  const client = getResend();
  const from = process.env.EMAIL_FROM || "Automatyzacja Opinii <onboarding@resend.dev>";

  if (!client) {
    console.log("[email:dev-fallback] RESEND_API_KEY not set, logging instead of sending:");
    console.log({ to, subject, text });
    return;
  }

  await client.emails.send({ from, to, subject, text });
}
