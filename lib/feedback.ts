import { query } from "@/lib/db";

export async function saveFeedback(input: {
  clientSlug: string;
  rating: number;
  name?: string;
  email?: string;
  comment?: string;
}): Promise<void> {
  await query(
    `insert into feedback (client_slug, rating, name, email, comment)
     values ($1, $2, $3, $4, $5)`,
    [input.clientSlug, input.rating, input.name || null, input.email || null, input.comment || null]
  );
}

export type ClientStats = {
  slug: string;
  totalScans: number;
  averageRating: number | null;
  positiveCount: number;
  negativeCount: number;
};

export async function getStatsForClient(slug: string): Promise<ClientStats> {
  const result = await query<{
    total: string;
    average: string | null;
    positive: string;
    negative: string;
  }>(
    `select
       count(*)::text as total,
       avg(rating)::text as average,
       count(*) filter (where rating >= 4)::text as positive,
       count(*) filter (where rating <= 3)::text as negative
     from feedback
     where client_slug = $1`,
    [slug]
  );
  const row = result.rows[0];
  return {
    slug,
    totalScans: Number(row?.total ?? 0),
    averageRating: row?.average ? Number(row.average) : null,
    positiveCount: Number(row?.positive ?? 0),
    negativeCount: Number(row?.negative ?? 0),
  };
}

export type RecentFeedback = {
  id: number;
  rating: number;
  name: string | null;
  email: string | null;
  comment: string | null;
  createdAt: string;
};

export async function getRecentNegativeFeedback(
  slug: string,
  limit = 20
): Promise<RecentFeedback[]> {
  const result = await query<{
    id: number;
    rating: number;
    name: string | null;
    email: string | null;
    comment: string | null;
    created_at: string;
  }>(
    `select id, rating, name, email, comment, created_at
     from feedback
     where client_slug = $1 and rating <= 3
     order by created_at desc
     limit $2`,
    [slug, limit]
  );
  return result.rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    name: r.name,
    email: r.email,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}
