import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { generateThankYouEmail } from "@/lib/claude";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/ratelimit";
import { saveFeedback } from "@/lib/feedback";

type FeedbackBody = {
  slug?: string;
  rating?: number;
  name?: string;
  email?: string;
  comment?: string;
};

export async function POST(req: NextRequest) {
  let body: FeedbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const { slug, rating, name, email, comment } = body;

  if (!slug || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await checkRateLimit(`${slug}:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Zbyt wiele zgłoszeń, spróbuj później." }, { status: 429 });
  }

  const client = await getClient(slug);
  if (!client) {
    return NextResponse.json({ error: "Nie znaleziono firmy." }, { status: 404 });
  }

  await saveFeedback({ clientSlug: slug, rating, name, email, comment });

  if (rating >= 4) {
    if (email) {
      const thankYou = await generateThankYouEmail({
        businessName: client.name,
        customerName: name,
        rating,
      });
      await sendEmail({ to: email, subject: thankYou.subject, text: thankYou.body });
    }
    return NextResponse.json({ ok: true });
  }

  // rating 1-3: private feedback, never posted publicly — alert the owner.
  const lines = [
    `Nowa prywatna opinia (${rating}/5) — ${client.name}`,
    "",
    `Imię: ${name || "(nie podano)"}`,
    `E-mail: ${email || "(nie podano)"}`,
    `Komentarz: ${comment || "(brak komentarza)"}`,
  ];
  await sendEmail({
    to: client.ownerEmail,
    subject: `Prywatna opinia ${rating}★ — ${client.name}`,
    text: lines.join("\n"),
  });

  return NextResponse.json({ ok: true });
}
