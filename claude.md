# CLAUDE.md — Spendr (Personal Expense Tracker)

## What this is

Single-user PWA expense tracker. Fast logging, optional monthly budget, local NLP input, spending analytics. No income, no balance, no multi-user, no bank sync.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth, single user)
- Framer Motion (micro-interactions only, no decorative bloat)
- Recharts for analytics
- PWA via next-pwa or manual manifest + service worker
- Vercel deploy

## Design principles

- Logging an expense must take under 3 seconds and never more than 2 taps for a recurring category.
- Offline-first: a log must succeed with no connection and sync later. Dead network never blocks input.
- Opinionated defaults over configuration. Date = today, last category pre-selected.
- No em-dashes in any UI copy or comments.
- Mobile-first. Desktop is a wider version of the same layout, not a separate design.

## Data model (Supabase)

expenses

- id              uuid pk default gen_random_uuid()
- amount          numeric(12,2) not null check (amount > 0)
- category_id     uuid fk -> categories.id not null
- note            text
- spent_at        date not null default current_date
- created_at      timestamptz default now()
- synced          boolean default true  -- client-side flag, not stored server-side

categories

- id              uuid pk default gen_random_uuid()
- name            text not null unique
- color           text not null          -- hex, for charts/chips
- keywords        text[] default '{}'    -- for NLP matching: ['dinner','lunch','food']
- icon            text                   -- lucide icon name
- sort_order      int default 0
- is_archived     boolean default false

budgets

- id              uuid pk default gen_random_uuid()
- month           date not null unique   -- first day of month, e.g. 2026-06-01
- total_cap       numeric(12,2)          -- nullable: monthly budget is optional
- created_at      timestamptz default now()

category_budgets       -- optional per-category caps

- id              uuid pk default gen_random_uuid()
- budget_id       uuid fk -> budgets.id not null
- category_id     uuid fk -> categories.id not null
- cap             numeric(12,2) not null
- unique(budget_id, category_id)

Seed categories: Light Bill, WiFi, Eating Out, Groceries, Transport, Rent, Shopping, Health, Other.

## Local NLP parser

Pure client-side function, no API. Input string -> { amount, categoryId, note }.

Parse logic:

1. Extract first number (regex /\d+(\d{1,2})?/) as amount. Strip currency symbols and commas.
2. Lowercase remaining tokens, match against each category's keywords[] array. First match wins.
3. If no keyword match, fall back to "Other" and put full text in note.
4. Whatever text isn't the amount or the matched keyword becomes the note.

Examples:

- "400 dinner"        -> { amount: 400, category: Eating Out, note: null }
- "800 wifi bill"     -> { amount: 800, category: WiFi, note: "bill" }
- "1200 groceries dmart" -> { amount: 1200, category: Groceries, note: "dmart" }
- "250"               -> { amount: 250, category: last-used or Other, note: null }

Keep keywords editable in a category settings screen so the parser improves over time.

## Recurring templates

templates

- id, label, amount, category_id, default_day (int 1-31, nullable)

One-tap log from a saved template. If default_day is set and within 3 days, surface that template at the top of the quick-add screen as a suggestion chip.

## Screens

1. Home / Quick-add
  - Top: NLP text input ("400 dinner") with a parse-preview line showing detected amount + category before confirm.
  - Below: amount field (numeric keypad) + horizontal scroll category chips, ordered by most-frequent-this-week.
  - Optional collapsed note field.
  - If budget set for current month: sticky header showing Remaining (countdown, red when negative) + daily burn rate ("683/day for 12 days").
  - Recent expenses list below, each editable/deletable with undo.
2. Analytics
  - Weekly: bar chart, spend per day, current week with prev-week toggle.
  - Monthly: trend line across last 6 months.
  - Category breakdown: donut for selected month.
  - Category-over-time: stacked bar across months to show drift.
  - Month-end summary card: total, vs cap, biggest category, biggest single expense, zero-spend day count.
3. Budget
  - Toggle monthly budget on/off.
  - Set total_cap. Optional per-category caps with progress bars.
4. Settings
  - Manage categories (name, color, icon, keywords).
  - Manage templates.
  - CSV export (all expenses, date-range filterable).

## Offline sync

- Write to IndexedDB (or localStorage for v1 simplicity) immediately, mark synced=false.
- Background sync pushes unsynced rows to Supabase when online.
- Reads merge local-unsynced + server rows.
- Last-write-wins on conflict (single user, low risk).

## Search/filter

Filter expenses by category, date range, and note text substring. Drives both the list view and CSV export scope.

## Build order

1. Supabase schema + seed categories + RLS (single user, auth.uid() = owner).
2. Quick-add with chips + manual amount, write to Supabase.
3. NLP parser + parse-preview.
4. Recent list with edit/delete/undo.
5. Budget toggle + remaining + burn rate.
6. Analytics charts.
7. Templates.
8. PWA manifest + service worker + offline queue.
9. CSV export + search/filter.

## Out of scope (do not build)

Income, running balance, multi-currency, expense splitting, bank sync, multi-user, recurring auto-charges without confirmation.

## Styling guide

### Direction

Calm, dense, financial. This is a tool you open ten times a day, not a dashboard you admire. Closer to a native iOS finance app than a marketing site. Information density over whitespace luxury. No gradients-as-decoration, no glassmorphism, no hero sections.

### Color

- Dark-first. Design dark, derive light from it, not the reverse. You log expenses at night.
- Near-black background, not pure #000. Use a desaturated slate: bg #0F1115, surface #16181D, elevated #1E2128.
- One accent only, used sparingly for primary actions and active states. Pick a cool green or indigo; reserve it, don't spray it.
- Semantic colors carry real meaning here: spending is neutral (foreground text), over-budget is red, under-budget headroom is the accent. Never use red decoratively since it means "you overspent."
- Category colors are the one place color runs free. Each category gets a distinct hue for chips and charts. Keep them muted, not neon, so a screen full of chips doesn't vibrate.

### Typography

- One sans for UI: Inter or Geist.
- Tabular numbers everywhere money appears. font-variant-numeric: tabular-nums. Non-negotiable. Amounts must align and not jump width as digits change.
- Amounts are the loudest thing on screen. Big, tight tracking, medium-to-semibold weight. Labels and notes recede: smaller, muted foreground (#8B8F99).
- A real type scale, not ad-hoc sizes. 12 / 14 / 16 / 20 / 28 / 40. The 40 is reserved for the remaining-budget hero number.

### Layout

- Mobile column max ~440px, centered on desktop. Don't stretch the logging UI across a wide screen.
- 4px spacing base. Generous vertical rhythm in lists so rows are thumb-tappable (min 44px tap targets).
- The quick-add bar is the visual anchor of the home screen. It should feel like the center of gravity, slightly elevated surface, always reachable with one thumb.

### Components

- Category chips: pill-shaped, the category's color at low opacity as fill, full color as text/border when active. Tap target min 44px tall.
- Expense rows: amount right-aligned and tabular, category dot + name left, note muted below or inline, date subtle. No card borders in the list, use subtle row separation via background or hairline dividers.
- Charts (Recharts): strip the default chartjunk. No gridlines unless needed, no drop shadows, no 3D. Bars and lines in category colors or the single accent. Axis labels muted and small. Let the data be the only ink.
- The remaining-budget number: the one moment of drama. Large, tabular, color-shifts neutral to red as it crosses zero. Burn-rate line sits quietly beneath it.

### Motion (Framer Motion, restrained)

- Logging an expense: the new row slides in and the remaining number counts down to its new value. That count animation is the reward loop that makes you keep logging. Worth doing well.
- Undo: row collapses, toast slides up.
- Everything else: 150-200ms ease, or nothing. No page-load orchestration, no staggered reveals on a tool you use daily. Delight on first use becomes friction on the hundredth.

### Hard rules

- No em-dashes in any UI copy, labels, empty states, or comments.
- No emojis in the UI.
- Empty states get one plain sentence and a sample input hint, not an illustration.
- Don't center-align body text. Numbers right, labels left.
- Resist adding a second accent color. The constraint is the look.

## Git / GitHub workflow

### Tooling

- Use `gh` (GitHub CLI) for all GitHub operations: issues, PRs, merges.
- Use plain `git` for commit/push.
- Repo: jmakwana0x1/Spendr (create it if it doesn't exist via `gh repo create`).

### Branching

- Never commit directly to main.
- One branch per unit of work, named feat/, fix/, or chore/.
- Branch off latest main every time: git checkout main && git pull && git checkout -b feat/.

### Commit style

- Conventional commits: feat:, fix:, chore:, refactor:, docs:.
- Imperative mood, lowercase, no period. "feat: add nlp parse preview" not "Added preview."
- No em-dashes in commit messages or PR bodies.
- Small, logical commits. Don't bundle the schema, the UI, and the charts into one commit.

### Per-feature loop

For each item in the build order:

1. Open an issue describing the unit of work: gh issue create --title "..." --body "..."
2. Branch off main: feat/.
3. Build, committing in logical steps.
4. Push: git push -u origin feat/.
5. Open PR linked to the issue: gh pr create --title "..." --body "Closes #\n\n<what changed, how to test>".
6. Merge: gh pr merge --squash --delete-branch.
7. The "Closes #n" line auto-closes the issue on merge.

### PR body format

- One-line summary.
- What changed (bulleted).
- How to test locally.
- Closes #.

### Rules

- Squash-merge always. Keeps main history one-commit-per-feature and clean.
- Delete the branch after merge.
- Don't merge with failing typecheck or build. Run npm run build and tsc --noEmit before opening the PR.
- Don't force-push to main, ever.



## Auth (Google OAuth via Supabase)

### Approach

- Supabase Auth with Google as the only provider. No email/password, no magic links.

- Single user enforced by keeping the Google OAuth consent screen in testing mode with only your email as a test user. No one else can complete sign-in.

### Flow

- Sign-in screen: one "Continue with Google" button, nothing else.

- supabase.auth.signInWithOAuth({ provider: 'google' }).

- On callback, Supabase sets the session. App reads it via supabase.auth.getSession() / onAuthStateChange.

- Route protection: middleware redirects unauthenticated users to /login. Use @supabase/ssr for App Router session handling in middleware and server components.

### Data model change

Every table gets a user_id column (uuid, fk -> [auth.users.id](http://auth.users.id), default auth.uid()).

- expenses, categories, budgets, category_budgets, templates: add user_id.

- RLS on each table: using (auth.uid() = user_id) for select/insert/update/delete.

- Insert policies set user_id = auth.uid() automatically via default.

### Env vars

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

### Rules

- Never commit .env. Add to .gitignore.

- Use @supabase/ssr, not the deprecated auth-helpers package.

- Session refresh handled in middleware so server components always see a fresh session.

