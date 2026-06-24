import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppData,
  Budget,
  Category,
  CategoryBudget,
  Expense,
  Template,
} from "./types";

// Tables are prefixed so they never collide in a shared Supabase project.
// `spendr_category_budgets` is `categoryBudgets` in AppData.
export type SyncTable =
  | "spendr_categories"
  | "spendr_expenses"
  | "spendr_budgets"
  | "spendr_category_budgets"
  | "spendr_templates";

export const TABLES = {
  categories: "spendr_categories",
  expenses: "spendr_expenses",
  budgets: "spendr_budgets",
  categoryBudgets: "spendr_category_budgets",
  templates: "spendr_templates",
} as const;

// A queued change. Persisted so writes made offline flush once back online.
export type SyncOp =
  | { kind: "upsert"; table: SyncTable; id: string; row: Record<string, unknown> }
  | { kind: "delete"; table: SyncTable; id: string };

// ---- app type -> DB row (adds user_id, drops client-only fields) ----

export function categoryRow(c: Category, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    keywords: c.keywords,
    icon: c.icon,
    sort_order: c.sort_order,
    is_archived: c.is_archived,
  };
}

export function expenseRow(e: Expense, userId: string) {
  // `synced` is a client-only flag and is not stored server-side.
  return {
    id: e.id,
    user_id: userId,
    amount: e.amount,
    category_id: e.category_id,
    note: e.note,
    spent_at: e.spent_at,
    created_at: e.created_at,
  };
}

export function budgetRow(b: Budget, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    month: b.month,
    total_cap: b.total_cap,
    created_at: b.created_at,
  };
}

export function categoryBudgetRow(cb: CategoryBudget, userId: string) {
  return {
    id: cb.id,
    user_id: userId,
    budget_id: cb.budget_id,
    category_id: cb.category_id,
    cap: cb.cap,
  };
}

export function templateRow(t: Template, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    label: t.label,
    amount: t.amount,
    category_id: t.category_id,
    default_day: t.default_day,
  };
}

// ---- DB row -> app type ----

function toExpense(r: any): Expense {
  return {
    id: r.id,
    amount: Number(r.amount),
    category_id: r.category_id,
    note: r.note,
    spent_at: r.spent_at,
    created_at: r.created_at,
    synced: true,
  };
}

function toCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    keywords: r.keywords ?? [],
    icon: r.icon ?? "Circle",
    sort_order: r.sort_order ?? 0,
    is_archived: !!r.is_archived,
  };
}

function toBudget(r: any): Budget {
  return {
    id: r.id,
    month: r.month,
    total_cap: r.total_cap == null ? null : Number(r.total_cap),
    created_at: r.created_at,
  };
}

function toCategoryBudget(r: any): CategoryBudget {
  return {
    id: r.id,
    budget_id: r.budget_id,
    category_id: r.category_id,
    cap: Number(r.cap),
  };
}

function toTemplate(r: any): Template {
  return {
    id: r.id,
    label: r.label,
    amount: Number(r.amount),
    category_id: r.category_id,
    default_day: r.default_day == null ? null : Number(r.default_day),
  };
}

// Pull the full dataset for the signed-in user. RLS scopes rows to them.
export async function pullAll(supabase: SupabaseClient): Promise<AppData> {
  const [cats, exps, buds, catBuds, temps] = await Promise.all([
    supabase.from(TABLES.categories).select("*"),
    supabase.from(TABLES.expenses).select("*"),
    supabase.from(TABLES.budgets).select("*"),
    supabase.from(TABLES.categoryBudgets).select("*"),
    supabase.from(TABLES.templates).select("*"),
  ]);

  const firstError =
    cats.error || exps.error || buds.error || catBuds.error || temps.error;
  if (firstError) throw firstError;

  return {
    categories: (cats.data ?? []).map(toCategory),
    expenses: (exps.data ?? [])
      .map(toExpense)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    budgets: (buds.data ?? []).map(toBudget),
    categoryBudgets: (catBuds.data ?? []).map(toCategoryBudget),
    templates: (temps.data ?? []).map(toTemplate),
  };
}

// Apply one queued op. Throws on failure so the caller can keep it queued.
export async function applyOp(supabase: SupabaseClient, op: SyncOp): Promise<void> {
  if (op.kind === "upsert") {
    const { error } = await supabase.from(op.table).upsert(op.row, { onConflict: "id" });
    if (error) throw error;
  } else {
    const { error } = await supabase.from(op.table).delete().eq("id", op.id);
    if (error) throw error;
  }
}

// Seed the default categories for a brand-new user (empty server account).
export async function seedRemoteCategories(
  supabase: SupabaseClient,
  categories: Category[],
  userId: string
): Promise<void> {
  const rows = categories.map((c) => categoryRow(c, userId));
  const { error } = await supabase.from(TABLES.categories).upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
