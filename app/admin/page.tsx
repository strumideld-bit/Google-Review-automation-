import { listClients } from "@/lib/clients";
import { getStatsForClient, getRecentNegativeFeedback } from "@/lib/feedback";
import { createClientAction } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const clients = await listClients();
  const rows = await Promise.all(
    clients.map(async (client) => ({
      client,
      stats: await getStatsForClient(client.slug),
      negative: await getRecentNegativeFeedback(client.slug, 5),
    }))
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Panel administracyjny</h1>

      <section className={styles.card}>
        <h2>Dodaj klienta</h2>
        <form action={createClientAction} className={styles.formGrid}>
          <input name="name" placeholder="Nazwa firmy" required />
          <input name="slug" placeholder="adres-url (np. kawiarnia-zacisze)" required />
          <input name="googleReviewUrl" placeholder="Link do opinii Google" required />
          <input name="ownerEmail" placeholder="E-mail właściciela" className="half" required />
          <input name="accentColor" placeholder="#1F5C43" className="half" defaultValue="#1F5C43" />
          <button type="submit" className={styles.submit}>
            Dodaj
          </button>
        </form>
      </section>

      {rows.map(({ client, stats, negative }) => (
        <section key={client.slug} className={styles.card}>
          <div className={styles.clientHeader}>
            <h2>{client.name}</h2>
            <a href={`/${client.slug}`}>/{client.slug} →</a>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <b>{stats.totalScans}</b>skanów
            </div>
            <div className={styles.stat}>
              <b>{stats.averageRating ? stats.averageRating.toFixed(1) : "—"}</b>śr. ocena
            </div>
            <div className={styles.stat}>
              <b>{stats.positiveCount}</b>do Google
            </div>
            <div className={styles.stat}>
              <b>{stats.negativeCount}</b>prywatnych
            </div>
          </div>

          {negative.length === 0 ? (
            <p className={styles.empty}>Brak prywatnych zgłoszeń.</p>
          ) : (
            <ul className={styles.negativeList}>
              {negative.map((item) => (
                <li key={item.id}>
                  <div>
                    {item.rating}★ — {item.comment || "(brak komentarza)"}
                  </div>
                  <div className={styles.meta}>
                    {item.name || "anonimowo"} · {item.email || "brak e-maila"} ·{" "}
                    {new Date(item.createdAt).toLocaleString("pl-PL")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
