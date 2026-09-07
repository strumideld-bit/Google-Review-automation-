import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a Postgres database (Neon/Supabase/Vercel " +
        "Postgres all work), run db/schema.sql against it, then set DATABASE_URL."
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}
