import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type ThankYouEmail = { subject: string; body: string };

/**
 * Asks Claude to write a short, warm thank-you email in Polish for a
 * customer who just left a positive (4-5 star) rating, nudging them to
 * finish/share their Google review if they haven't already.
 */
export async function generateThankYouEmail(params: {
  businessName: string;
  customerName?: string;
  rating: number;
}): Promise<ThankYouEmail> {
  const { businessName, customerName, rating } = params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackThankYouEmail(params);
  }

  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          `Napisz krótki, ciepły e-mail z podziękowaniem po polsku dla klienta firmy "${businessName}".`,
          customerName
            ? `Klient nazywa się ${customerName} — zwróć się do niego po imieniu.`
            : `Nie znamy imienia klienta — zwróć się bezosobowo, ale ciepło.`,
          `Klient ocenił wizytę na ${rating}/5 gwiazdek.`,
          `Cel e-maila: podziękować za wizytę i delikatnie zachęcić, żeby dokończył/podzielił się opinią na Google, jeśli jeszcze tego nie zrobił.`,
          `Ton: naturalny, krótki (3-5 zdań), bez sztucznego marketingowego języka, bez emoji.`,
          `Odpowiedz WYŁĄCZNIE w formacie JSON: {"subject": "...", "body": "..."} bez żadnego dodatkowego tekstu.`,
        ].join("\n"),
      },
    ],
  });

  const text = message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");

  try {
    const parsed = JSON.parse(extractJson(text));
    if (typeof parsed.subject === "string" && typeof parsed.body === "string") {
      return parsed;
    }
  } catch {
    // fall through to fallback below
  }

  return fallbackThankYouEmail(params);
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end >= start ? text.slice(start, end + 1) : text;
}

function fallbackThankYouEmail({
  businessName,
  customerName,
}: {
  businessName: string;
  customerName?: string;
  rating: number;
}): ThankYouEmail {
  const greeting = customerName ? `Cześć ${customerName},` : "Cześć,";
  return {
    subject: `Dziękujemy za wizytę w ${businessName}!`,
    body: `${greeting}\n\ndziękujemy, że odwiedziliście ${businessName} i że poświęciliście chwilę na ocenę wizyty. Bardzo nam miło!\n\nJeśli macie jeszcze minutę, będzie nam bardzo pomocna Wasza opinia na Google — do zobaczenia następnym razem!\n\nPozdrawiamy,\nZespół ${businessName}`,
  };
}
