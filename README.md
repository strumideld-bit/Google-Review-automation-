# Automatyzacja Opinii

Landing page + backend for the Google-review-automation product: a customer
scans a QR code on their receipt, rates their visit 1-5 stars, and:

- **4-5 stars** → redirected straight to the business's Google review page.
  If they leave an email, Claude writes a short personalized thank-you note
  that gets emailed to them.
- **1-3 stars** → sent to a private feedback form instead. Nothing is posted
  publicly; the business owner gets an instant email alert with the details.

Every scan is stored, so `/admin` shows each client's scan count, average
rating, and recent private feedback.

## Setup

```sh
npm install
cp .env.example .env.local   # then fill in the keys below
```

You need a Postgres database before anything else works (client lookup and
feedback storage both go through it now):

1. Create a free database — [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) both work, no credit card needed.
2. Put its connection string in `DATABASE_URL` in `.env.local`.
3. Apply the schema once: `psql "$DATABASE_URL" -f db/schema.sql` (this also
   seeds the `demo` client so `/demo` works right away).

```sh
npm run dev
```

Open `http://localhost:3000/demo` to try the flow, and
`http://localhost:3000/admin` for the dashboard (needs `ADMIN_PASSWORD` set —
see below).

### Environment variables (`.env.local`)

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Nothing works without it. |
| `ANTHROPIC_API_KEY` | No | Personalizes the thank-you email. Without it, a plain template is used instead (see `lib/claude.ts`). |
| `RESEND_API_KEY` | No | Actually sends emails. Without it, emails are just logged to the console — handy for local testing. |
| `EMAIL_FROM` | No | Sender address. Must be on a domain verified in Resend to deliver for real. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | No | Rate-limits `/api/feedback` (5 submissions per client+IP per 10 min). Without it, rate limiting is skipped — fine for local dev, **set this before real traffic**. Free tier at [upstash.com](https://upstash.com). |
| `ADMIN_PASSWORD` | No | Unlocks `/admin`. The dashboard returns a 503 until this is set. |

## Adding a new client

Go to `/admin` (Basic Auth login, username can be anything, password is
`ADMIN_PASSWORD`) and use the "Dodaj klienta" form — it writes straight to
the database, no redeploy needed.

You'll need, per client:
- **Slug** — becomes `yourdomain.com/<slug>`, lowercase/numbers/hyphens only.
- **Google review link** — from their Google Business Profile → "Get more
  reviews" → copy the short link, or build one from their Place ID:
  `https://search.google.com/local/writereview?placeid=<PLACE_ID>`.
- **Owner email** — where 1-3★ private feedback gets sent.

Then generate a QR code pointing at `https://yourdomain.com/<slug>` (any
free QR generator — it's just a URL) and put it on their receipts, table
tents, or counter.

## Tests

```sh
npx playwright install   # once, downloads browser binaries
npm run test:e2e
```

The tests run against the seeded `demo` client, so `DATABASE_URL` must
already have the schema applied. They cover both branches of the flow: a
5-star rating redirecting to Google, and a low rating routing to the private
form without ever mentioning Google.

## Deploying

This machine doesn't have Node.js, git, or the Vercel CLI installed, so I
couldn't run installs, tests, or a deploy from here — everything above is
written but unexecuted. To actually go live:

1. **Install locally**: [Node.js LTS](https://nodejs.org) and
   [Git](https://git-scm.com/download/win) (or `winget install OpenJS.NodeJS.LTS Git.Git`
   if you'd rather not click through installers).
2. `npm install` in this folder, then `npm run build` to confirm it compiles
   — first real chance to catch anything I couldn't verify by hand.
3. Push this folder to a new GitHub repo.
4. Import that repo on [vercel.com](https://vercel.com) (or `npx vercel`
   from this folder) and add every variable from the table above in the
   project's Environment Variables settings.
5. You don't have a custom domain yet, so it'll be live at
   `your-project.vercel.app/<slug>` — fine for testing and even a first few
   real clients. Add a custom domain later in Vercel's settings, no code
   changes needed.

## Known limitations

- **No rate limiting without Upstash configured.** The endpoint is public;
  set `UPSTASH_REDIS_REST_URL`/`TOKEN` before real traffic.
- **GDPR.** There's a consent checkbox before capturing email, but no actual
  privacy policy page. Add one (and link it from the checkbox label) before
  using this with real customer data.
- **Admin auth is a single shared password**, not per-user accounts — fine
  for one operator (you), not for handing dashboard access to clients
  directly.
