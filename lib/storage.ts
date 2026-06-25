import type { AppData } from "./types";
import type { SyncOp } from "./sync";
import { SEED_CATEGORIES, healSeedKeywords } from "./seed";

// v2: seed category ids became UUIDs for Supabase compatibility.
const KEY = "spendr:data:v2";
const OPS_KEY = "spendr:ops:v1";

export function emptyData(): AppData {
  return {
    categories: SEED_CATEGORIES.map((c) => ({ ...c })),
    expenses: [],
    budgets: [],
    categoryBudgets: [],
    templates: [],
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge with defaults so newly added fields/arrays never come back undefined.
    const base = emptyData();
    return {
      categories: parsed.categories?.length
        ? healSeedKeywords(parsed.categories)
        : base.categories,
      expenses: parsed.expenses ?? base.expenses,
      budgets: parsed.budgets ?? base.budgets,
      categoryBudgets: parsed.categoryBudgets ?? base.categoryBudgets,
      templates: parsed.templates ?? base.templates,
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked. A logging tool must never crash on a write.
  }
}

export const DATA_KEY = KEY;

// ---- offline op queue ----

export function loadOps(): SyncOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OPS_KEY);
    return raw ? (JSON.parse(raw) as SyncOp[]) : [];
  } catch {
    return [];
  }
}

export function saveOps(ops: SyncOp[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  } catch {
    // ignore
  }
}
