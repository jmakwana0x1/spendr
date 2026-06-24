# Spendr

Single-user PWA expense tracker. Fast logging, optional monthly budget, local NLP input, spending analytics. Built to the spec in `claude.md`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

That is all you need. With no environment variables the app runs fully local: data lives in `localStorage`, categories are seeded automatically, and every screen works offline.

## Optional: cloud sync and Google sign-in

Copy `.env.example` to `.env.local` and fill in your Supabase keys:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then apply the schema in `supabase/schema.sql` (Supabase SQL editor). It creates the tables, single-user RLS (`auth.uid() = user_id`), and has a commented seed block. When the keys are present, `/login` shows "Continue with Google" and middleware protects routes. Keep the Google OAuth consent screen in testing mode with only your email as a test user to stay single-user.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the build
- `npm run typecheck` — `tsc --noEmit`

## Structure

```
app/            routes: / (quick-add), /analytics, /budget, /settings, /login, /auth/callback
components/     UI: chips, expense row, budget header, edit sheet, toast, nav, charts
lib/            types, seed, nlp parser, selectors (budget + analytics math), storage, csv, supabase
supabase/       schema.sql (run when you turn on cloud sync)
public/         manifest.json, sw.js (app-shell offline), icon.svg
```

## Notes on scope

The data layer is `localStorage` behind a typed store (`lib/store.tsx`), which is the spec's v1 choice. Swapping in Supabase reads/writes is isolated to that store plus `lib/supabase*.ts`. The NLP parser (`lib/nlp.ts`) is pure and client-side. Out of scope by design: income, running balance, multi-currency, splitting, bank sync, multi-user.
