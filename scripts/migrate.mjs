import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Put it in .env.local and re-run with:");
  console.error("  node --env-file=.env.local scripts/migrate.mjs");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await pool.query(sql);
  console.log("Schema applied.");
} finally {
  await pool.end();
}
