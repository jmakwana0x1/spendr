-- ============================================================================
-- Spendr schema for a SHARED Supabase project.
-- Every object is prefixed `spendr_` so it never collides with other projects
-- in the same database. Safe to run more than once (idempotent).
-- Run this in: Supabase dashboard -> SQL Editor -> New query -> Run.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (enabled by default on Supabase).
create extension if not exists pgcrypto;

-- ---------- spendr_categories ----------
create table if not exists public.spendr_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null,
  keywords    text[] not null default '{}',
  icon        text,
  sort_order  int not null default 0,
  is_archived boolean not null default false,
  unique (user_id, name)
);

-- ---------- spendr_expenses ----------
create table if not exists public.spendr_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  category_id uuid not null references public.spendr_categories (id),
  note        text,
  spent_at    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists spendr_expenses_user_spent_idx
  on public.spendr_expenses (user_id, spent_at desc);

-- ---------- spendr_budgets ----------
create table if not exists public.spendr_budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month      date not null,
  total_cap  numeric(12,2),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- ---------- spendr_category_budgets ----------
create table if not exists public.spendr_category_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  budget_id   uuid not null references public.spendr_budgets (id) on delete cascade,
  category_id uuid not null references public.spendr_categories (id),
  cap         numeric(12,2) not null,
  unique (budget_id, category_id)
);

-- ---------- spendr_templates ----------
create table if not exists public.spendr_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null,
  amount      numeric(12,2) not null check (amount > 0),
  category_id uuid not null references public.spendr_categories (id),
  default_day int check (default_day between 1 and 31)
);

-- ---------- Row Level Security: each user sees only their own rows ----------
alter table public.spendr_categories       enable row level security;
alter table public.spendr_expenses         enable row level security;
alter table public.spendr_budgets          enable row level security;
alter table public.spendr_category_budgets enable row level security;
alter table public.spendr_templates        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'spendr_categories','spendr_expenses','spendr_budgets',
    'spendr_category_budgets','spendr_templates'
  ]
  loop
    execute format('drop policy if exists spendr_owner_all on public.%I;', t);
    execute format(
      'create policy spendr_owner_all on public.%I for all '
      || 'using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- Categories are seeded automatically by the app on first sign-in, so no seed
-- INSERTs are needed here. Single-user is enforced by keeping the Google OAuth
-- consent screen in testing mode with only your email as a test user.
