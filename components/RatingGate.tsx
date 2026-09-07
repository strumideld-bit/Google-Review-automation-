"use client";

import { useState, type CSSProperties } from "react";
import type { Client } from "@/lib/clients";
import styles from "./RatingGate.module.css";

type Stage = "rate" | "positive" | "negative" | "done";

const STAR = (
  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6z" />
);

function starWord(value: number): string {
  if (value === 1) return "gwiazdka";
  if (value === 5) return "gwiazdek";
  return "gwiazdki";
}

export default function RatingGate({ client }: { client: Client }) {
  const [stage, setStage] = useState<Stage>("rate");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function pickStar(value: number) {
    setRating(value);
    setStage(value >= 4 ? "positive" : "negative");
  }

  async function submitFeedback(payload: Record<string, unknown>) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: client.slug, rating, ...payload }),
      });
    } catch {
      // best-effort — never block the customer on a network hiccup
    }
  }

  async function handlePositiveSubmit() {
    if (email && !consent) {
      setError("Zaznacz zgodę, żebyśmy mogli wysłać podziękowanie.");
      return;
    }
    setSending(true);
    await submitFeedback({ name: name || undefined, email: email || undefined });
    window.location.href = client.googleReviewUrl;
  }

  function handleSkip() {
    window.location.href = client.googleReviewUrl;
  }

  async function handleNegativeSubmit() {
    if (!comment.trim()) {
      setError("Napisz kilka słów, co poszło nie tak.");
      return;
    }
    setSending(true);
    await submitFeedback({
      name: name || undefined,
      email: email || undefined,
      comment,
    });
    setStage("done");
  }

  return (
    <main
      className={styles.page}
      style={{ "--accent": client.accentColor } as CSSProperties}
    >
      <div className={styles.card}>
        {stage === "rate" && (
          <>
            <h1 className={styles.heading}>Jak oceniasz wizytę w {client.name}?</h1>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={styles.star}
                  aria-label={`${value} ${starWord(value)}`}
                  onClick={() => pickStar(value)}
                >
                  <svg viewBox="0 0 24 24">{STAR}</svg>
                </button>
              ))}
            </div>
          </>
        )}

        {stage === "positive" && (
          <>
            <h1 className={styles.heading}>Cieszymy się!</h1>
            <p className={styles.body}>
              Zostaw nam chwilę na Google — jeśli chcesz, zostaw też e-mail,
              a wyślemy Ci krótkie podziękowanie.
            </p>
            <input
              className={styles.field}
              type="text"
              placeholder="Imię (opcjonalnie)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={styles.field}
              type="email"
              placeholder="E-mail (opcjonalnie)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Wyrażam zgodę na kontakt e-mail w celu podziękowania za wizytę.
              </label>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="button"
              className={styles.primary}
              disabled={sending}
              onClick={handlePositiveSubmit}
            >
              Przejdź do Google →
            </button>
            {!email && (
              <button type="button" className={styles.secondary} onClick={handleSkip}>
                Pomiń i przejdź teraz
              </button>
            )}
          </>
        )}

        {stage === "negative" && (
          <>
            <h1 className={styles.heading}>Przykro nam to słyszeć</h1>
            <p className={styles.body}>
              Ta wiadomość trafi wyłącznie do właściciela — nic nie
              publikujemy. Napisz, co poszło nie tak, żebyśmy mogli to
              naprawić.
            </p>
            <input
              className={styles.field}
              type="text"
              placeholder="Imię (opcjonalnie)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={styles.field}
              type="email"
              placeholder="E-mail, jeśli chcesz odpowiedź"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              className={styles.field}
              placeholder="Co poszło nie tak?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="button"
              className={styles.primary}
              disabled={sending}
              onClick={handleNegativeSubmit}
            >
              Wyślij prywatnie
            </button>
          </>
        )}

        {stage === "done" && (
          <>
            <h1 className={styles.heading}>Dziękujemy za informację</h1>
            <p className={styles.body}>
              Zgłoszenie trafiło do właściciela {client.name}. Jeśli
              podałeś/aś e-mail, ktoś się z Tobą skontaktuje.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
