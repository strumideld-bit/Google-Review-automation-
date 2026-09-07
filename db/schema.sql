-- Run this once against your Postgres database (Neon, Supabase, Vercel
-- Postgres, or any Postgres host all work fine) before first deploy:
--   psql "$DATABASE_URL" -f db/schema.sql

create table if not exists clients (
  slug text primary key,
  name text not null,
  google_review_url text not null,
  owner_email text not null,
  accent_color text not null default '#1F5C43',
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id bigserial primary key,
  client_slug text not null references clients(slug) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  name text,
  email text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_client_slug_idx on feedback (client_slug, created_at desc);

-- Sample client so /demo keeps working after you switch to the database.
insert into clients (slug, name, google_review_url, owner_email, accent_color)
values (
  'demo',
  'Kawiarnia Zacisze',
  'https://search.google.com/local/writereview?placeid=REPLACE_ME',
  'strumidel.d@gmail.com',
  '#1F5C43'
)
on conflict (slug) do nothing;
