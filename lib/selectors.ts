import type { AppData, Budget, Category, Expense } from "./types";
import { localDateISO, monthStart, todayISO } from "./format";

export function categoriesById(cats: Category[]): Record<string, Category> {
  const m: Record<string, Category> = {};
  for (const c of cats) m[c.id] = c;
  return m;
}

export function activeCategories(cats: Category[]): Category[] {
  return cats
    .filter((c) => !c.is_archived)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

// Category chips ordered by most-frequent-this-week, then by sort order.
export function categoriesByWeekFrequency(
  cats: Category[],
  expenses: Expense[]
): Category[] {
  const since = localDateISO(startOfWeek());
  const counts: Record<string, number> = {};
  for (const e of expenses) {
    if (e.spent_at >= since) counts[e.category_id] = (counts[e.category_id] ?? 0) + 1;
  }
  return activeCategories(cats).sort((a, b) => {
    const diff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
    if (diff !== 0) return diff;
    return a.sort_order - b.sort_order;
  });
}

export function lastUsedCategoryId(expenses: Expense[]): string | null {
  if (!expenses.length) return null;
  // expenses are kept newest-first.
  const sorted = [...expenses].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );
  return sorted[0]?.category_id ?? null;
}

export function expensesInMonth(expenses: Expense[], month: string): Expense[] {
  // month is YYYY-MM-01; match by YYYY-MM prefix.
  const prefix = month.slice(0, 7);
  return expenses.filter((e) => e.spent_at.slice(0, 7) === prefix);
}

export function monthTotal(expenses: Expense[], month: string): number {
  return expensesInMonth(expenses, month).reduce((s, e) => s + e.amount, 0);
}

export function budgetForMonth(budgets: Budget[], month: string): Budget | null {
  return budgets.find((b) => b.month === month) ?? null;
}

export type BudgetStatus = {
  cap: number;
  spent: number;
  remaining: number;
  daysLeft: number;
  perDay: number; // remaining / days left
  over: boolean;
};

export function budgetStatus(
  data: AppData,
  month = monthStart()
): BudgetStatus | null {
  const budget = budgetForMonth(data.budgets, month);
  if (!budget || budget.total_cap == null) return null;

  const cap = budget.total_cap;
  const spent = monthTotal(data.expenses, month);
  const remaining = cap - spent;

  const now = new Date();
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const daysInMonth = new Date(year, mon, 0).getDate();
  const isCurrentMonth = monthStart(now) === month;
  const daysLeft = isCurrentMonth
    ? Math.max(1, daysInMonth - now.getDate() + 1)
    : 0;
  const perDay = daysLeft > 0 ? Math.max(0, remaining) / daysLeft : 0;

  return { cap, spent, remaining, daysLeft, perDay, over: remaining < 0 };
}

// ---- Analytics aggregations ----

export function spendPerDayOfWeek(
  expenses: Expense[],
  weekOffset = 0
): { label: string; date: string; total: number }[] {
  const base = startOfWeek();
  base.setDate(base.getDate() + weekOffset * 7);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const out: { label: string; date: string; total: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = localDateISO(d);
    const total = expenses
      .filter((e) => e.spent_at === iso)
      .reduce((s, e) => s + e.amount, 0);
    out.push({ label: labels[i], date: iso, total });
  }
  return out;
}

export function monthlyTrend(
  expenses: Expense[],
  monthsBack = 6
): { label: string; month: string; total: number }[] {
  const out: { label: string; month: string; total: number }[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = monthStart(d);
    out.push({
      label: d.toLocaleString("en", { month: "short" }),
      month,
      total: monthTotal(expenses, month),
    });
  }
  return out;
}

export function categoryBreakdown(
  data: AppData,
  month: string
): { id: string; name: string; color: string; total: number }[] {
  const inMonth = expensesInMonth(data.expenses, month);
  const byId = categoriesById(data.categories);
  const totals: Record<string, number> = {};
  for (const e of inMonth) totals[e.category_id] = (totals[e.category_id] ?? 0) + e.amount;
  return Object.entries(totals)
    .map(([id, total]) => ({
      id,
      name: byId[id]?.name ?? "Unknown",
      color: byId[id]?.color ?? "#8B8F99",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function categoryOverTime(
  data: AppData,
  monthsBack = 6
): { months: { label: string; month: string }[]; series: Record<string, number>[]; categories: Category[] } {
  const now = new Date();
  const months: { label: string; month: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en", { month: "short" }), month: monthStart(d) });
  }
  const cats = activeCategories(data.categories);
  const series = months.map(({ month }) => {
    const row: Record<string, number> = {};
    for (const c of cats) {
      row[c.id] = expensesInMonth(data.expenses, month)
        .filter((e) => e.category_id === c.id)
        .reduce((s, e) => s + e.amount, 0);
    }
    return row;
  });
  return { months, series, categories: cats };
}

export type CategoryDetail = {
  id: string;
  name: string;
  color: string;
  total: number;
  count: number;
  share: number; // fraction of the month's total, 0..1
  expenses: Expense[]; // this category's expenses, largest first
};

// Per-category breakdown for a month that also carries each expense (with its
// note) so the analytics screen can show the actual amounts and the labels you
// wrote, not just a percentage.
export function categoryDetail(data: AppData, month: string): CategoryDetail[] {
  const inMonth = expensesInMonth(data.expenses, month);
  const byId = categoriesById(data.categories);
  const monthTotal = inMonth.reduce((s, e) => s + e.amount, 0) || 1;
  const groups: Record<string, Expense[]> = {};
  for (const e of inMonth) (groups[e.category_id] ??= []).push(e);
  return Object.entries(groups)
    .map(([id, list]) => {
      const total = list.reduce((s, e) => s + e.amount, 0);
      return {
        id,
        name: byId[id]?.name ?? "Unknown",
        color: byId[id]?.color ?? "#8B8F99",
        total,
        count: list.length,
        share: total / monthTotal,
        expenses: list.slice().sort((a, b) => b.amount - a.amount),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type MonthSummary = {
  total: number;
  cap: number | null;
  biggestCategory: { name: string; total: number } | null;
  biggestExpense: Expense | null;
  zeroSpendDays: number;
};

export function monthSummary(data: AppData, month: string): MonthSummary {
  const inMonth = expensesInMonth(data.expenses, month);
  const total = inMonth.reduce((s, e) => s + e.amount, 0);
  const budget = budgetForMonth(data.budgets, month);
  const breakdown = categoryBreakdown(data, month);
  const biggestCategory = breakdown[0]
    ? { name: breakdown[0].name, total: breakdown[0].total }
    : null;
  const biggestExpense =
    inMonth.slice().sort((a, b) => b.amount - a.amount)[0] ?? null;

  // Zero-spend days only counts days you were actually tracking: from your
  // first logged day this month to today (or to month end for a past month).
  // Days before you started using the app are not "zero-spend" days.
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const lastDay = `${month.slice(0, 7)}-${String(new Date(year, mon, 0).getDate()).padStart(2, "0")}`;
  const today = todayISO();
  const isCurrent = monthStart(new Date()) === month;
  const isPast = today > lastDay;

  let zeroSpendDays = 0;
  if (inMonth.length > 0 && (isCurrent || isPast)) {
    const spentDaySet = new Set(inMonth.map((e) => e.spent_at));
    const firstDay = [...spentDaySet].sort()[0];
    const windowEnd = isCurrent ? today : lastDay;
    const start = new Date(firstDay + "T00:00:00");
    const end = new Date(windowEnd + "T00:00:00");
    const windowLen = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    zeroSpendDays = Math.max(0, windowLen - spentDaySet.size);
  }

  return {
    total,
    cap: budget?.total_cap ?? null,
    biggestCategory,
    biggestExpense,
    zeroSpendDays,
  };
}
