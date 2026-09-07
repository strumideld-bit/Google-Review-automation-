import { query } from "@/lib/db";

export type Client = {
  slug: string;
  name: string;
  /**
   * Direct Google review link for this business, e.g. a g.page/r/.../review
   * short link. Get it from Google Business Profile > "Get more reviews".
   */
  googleReviewUrl: string;
  /** Where private (1-3 star) feedback gets emailed. */
  ownerEmail: string;
  /** Used for the accent color on the client's page. */
  accentColor: string;
};

type ClientRow = {
  slug: string;
  name: string;
  google_review_url: string;
  owner_email: string;
  accent_color: string;
};

function fromRow(row: ClientRow): Client {
  return {
    slug: row.slug,
    name: row.name,
    googleReviewUrl: row.google_review_url,
    ownerEmail: row.owner_email,
    accentColor: row.accent_color,
  };
}

export async function getClient(slug: string): Promise<Client | undefined> {
  const result = await query<ClientRow>("select * from clients where slug = $1", [slug]);
  const row = result.rows[0];
  return row ? fromRow(row) : undefined;
}

export async function listClients(): Promise<Client[]> {
  const result = await query<ClientRow>("select * from clients order by created_at desc");
  return result.rows.map(fromRow);
}

export async function createClient(input: Client): Promise<void> {
  await query(
    `insert into clients (slug, name, google_review_url, owner_email, accent_color)
     values ($1, $2, $3, $4, $5)`,
    [input.slug, input.name, input.googleReviewUrl, input.ownerEmail, input.accentColor]
  );
}
