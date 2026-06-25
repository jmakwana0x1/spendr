"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppData,
  Budget,
  Category,
  CategoryBudget,
  Expense,
  Template,
} from "./types";
import {
  loadData,
  saveData,
  emptyData,
  loadOps,
  saveOps,
  DATA_KEY,
} from "./storage";
import { monthStart, todayISO, uid } from "./format";
import { freshSeedCategories, healSeedKeywords } from "./seed";
import { useAuth } from "./auth";
import {
  applyOp,
  budgetRow,
  categoryBudgetRow,
  categoryRow,
  expenseRow,
  pullAll,
  seedRemoteCategories,
  templateRow,
  TABLES,
  type SyncOp,
} from "./sync";

export type SyncStatus = "off" | "synced" | "pending" | "syncing" | "error";

type Store = {
  ready: boolean;
  data: AppData;
  syncStatus: SyncStatus;
  pendingCount: number;
  syncNow: () => void;

  addExpense: (input: {
    amount: number;
    category_id: string;
    note: string | null;
    spent_at?: string;
  }) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => Expense | null;
  restoreExpense: (expense: Expense) => void;

  addCategory: (input: Omit<Category, "id" | "sort_order" | "is_archived">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  archiveCategory: (id: string, archived: boolean) => void;

  setMonthlyCap: (month: string, total_cap: number | null) => void;
  setCategoryCap: (month: string, category_id: string, cap: number | null) => void;

  addTemplate: (input: Omit<Template, "id">) => void;
  updateTemplate: (id: string, patch: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;

  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  const [pendingCount, setPendingCount] = useState(0);

  // Refs hold the latest values so mutations stay pure functions of current
  // state and can derive sync ops without stale closures.
  const dataRef = useRef<AppData>(data);
  const opsRef = useRef<SyncOp[]>([]);
  const flushingRef = useRef(false);
  const syncEnabled = auth.enabled && !!auth.user;
  const userId = auth.user?.id ?? "";

  // Load local cache + queued ops on mount.
  useEffect(() => {
    const local = loadData();
    dataRef.current = local;
    opsRef.current = loadOps();
    setData(local);
    setPendingCount(opsRef.current.length);
    setReady(true);
  }, []);

  // Persist state + ops, keep refs in sync, and queue ops for the server.
  const commit = useCallback(
    (next: AppData, ops: SyncOp[]) => {
      dataRef.current = next;
      setData(next);
      saveData(next);
      if (syncEnabled && ops.length) {
        opsRef.current = [...opsRef.current, ...ops];
        saveOps(opsRef.current);
        setPendingCount(opsRef.current.length);
        void flush();
      }
    },
    // flush is stable via ref usage below
    [syncEnabled]
  );

  // Push queued ops to Supabase one at a time, oldest first.
  const flush = useCallback(async () => {
    if (!syncEnabled || !auth.supabase) return;
    if (flushingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus(opsRef.current.length ? "pending" : "synced");
      return;
    }
    if (opsRef.current.length === 0) {
      setSyncStatus("synced");
      return;
    }
    flushingRef.current = true;
    setSyncStatus("syncing");
    try {
      while (opsRef.current.length) {
        await applyOp(auth.supabase, opsRef.current[0]);
        opsRef.current = opsRef.current.slice(1);
        saveOps(opsRef.current);
        setPendingCount(opsRef.current.length);
      }
      setSyncStatus("synced");
    } catch {
      // Keep the failed op queued; retry on next change, focus, or online.
      setSyncStatus("error");
    } finally {
      flushingRef.current = false;
    }
  }, [syncEnabled, auth.supabase]);

  // Initial pull + bootstrap when the user signs in.
  useEffect(() => {
    if (!ready) return;
    if (!syncEnabled || !auth.supabase) {
      setSyncStatus("off");
      return;
    }
    let cancelled = false;
    (async () => {
      setSyncStatus("syncing");
      try {
        let server = await pullAll(auth.supabase!);
        if (server.categories.length === 0) {
          // Brand-new account: seed the default categories server-side with
          // fresh per-user ids so they never collide with another user's rows.
          const seeded = freshSeedCategories();
          await seedRemoteCategories(auth.supabase!, seeded, userId);
          server = { ...server, categories: seeded };
        }
        // Flush anything queued, then re-pull authoritative state.
        if (opsRef.current.length) {
          await flush();
          server = await pullAll(auth.supabase!);
        }
        // Recover built-in categories whose keywords were lost server-side, and
        // push the fix back up so other devices pick it up too.
        const healed = healSeedKeywords(server.categories);
        if (healed !== server.categories) {
          server = { ...server, categories: healed };
          await seedRemoteCategories(auth.supabase!, healed, userId);
        }
        if (cancelled) return;
        dataRef.current = server;
        setData(server);
        saveData(server);
        setSyncStatus(opsRef.current.length ? "pending" : "synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, syncEnabled, userId, auth.supabase]);

  // Retry queued ops when the tab regains focus or the network returns.
  useEffect(() => {
    if (!syncEnabled) return;
    const onlineHandler = () => void flush();
    const focusHandler = () => void flush();
    window.addEventListener("online", onlineHandler);
    window.addEventListener("focus", focusHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("focus", focusHandler);
    };
  }, [syncEnabled, flush]);

  // Mirror changes made in other tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === DATA_KEY) {
        const local = loadData();
        dataRef.current = local;
        setData(local);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- mutations ----

  const addExpense: Store["addExpense"] = useCallback(
    (input) => {
      const expense: Expense = {
        id: uid(),
        amount: input.amount,
        category_id: input.category_id,
        note: input.note,
        spent_at: input.spent_at ?? todayISO(),
        created_at: new Date().toISOString(),
        synced: !syncEnabled,
      };
      const d = dataRef.current;
      commit({ ...d, expenses: [expense, ...d.expenses] }, [
        { kind: "upsert", table: TABLES.expenses, id: expense.id, row: expenseRow(expense, userId) },
      ]);
      return expense;
    },
    [commit, syncEnabled, userId]
  );

  const updateExpense: Store["updateExpense"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      const existing = d.expenses.find((e) => e.id === id);
      if (!existing) return;
      const merged: Expense = { ...existing, ...patch, synced: !syncEnabled };
      commit(
        { ...d, expenses: d.expenses.map((e) => (e.id === id ? merged : e)) },
        [{ kind: "upsert", table: TABLES.expenses, id, row: expenseRow(merged, userId) }]
      );
    },
    [commit, syncEnabled, userId]
  );

  const deleteExpense: Store["deleteExpense"] = useCallback(
    (id) => {
      const d = dataRef.current;
      const removed = d.expenses.find((e) => e.id === id) ?? null;
      commit({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }, [
        { kind: "delete", table: TABLES.expenses, id },
      ]);
      return removed;
    },
    [commit]
  );

  const restoreExpense: Store["restoreExpense"] = useCallback(
    (expense) => {
      const d = dataRef.current;
      if (d.expenses.some((e) => e.id === expense.id)) return;
      const expenses = [expense, ...d.expenses].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1
      );
      commit({ ...d, expenses }, [
        { kind: "upsert", table: TABLES.expenses, id: expense.id, row: expenseRow(expense, userId) },
      ]);
    },
    [commit, userId]
  );

  const addCategory: Store["addCategory"] = useCallback(
    (input) => {
      const d = dataRef.current;
      const sort_order = d.categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
      const cat: Category = { ...input, id: uid(), sort_order, is_archived: false };
      commit({ ...d, categories: [...d.categories, cat] }, [
        { kind: "upsert", table: TABLES.categories, id: cat.id, row: categoryRow(cat, userId) },
      ]);
    },
    [commit, userId]
  );

  const updateCategory: Store["updateCategory"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      const existing = d.categories.find((c) => c.id === id);
      if (!existing) return;
      const merged: Category = { ...existing, ...patch };
      commit(
        { ...d, categories: d.categories.map((c) => (c.id === id ? merged : c)) },
        [{ kind: "upsert", table: TABLES.categories, id, row: categoryRow(merged, userId) }]
      );
    },
    [commit, userId]
  );

  const archiveCategory: Store["archiveCategory"] = useCallback(
    (id, archived) => {
      const d = dataRef.current;
      const existing = d.categories.find((c) => c.id === id);
      if (!existing) return;
      const merged: Category = { ...existing, is_archived: archived };
      commit(
        { ...d, categories: d.categories.map((c) => (c.id === id ? merged : c)) },
        [{ kind: "upsert", table: TABLES.categories, id, row: categoryRow(merged, userId) }]
      );
    },
    [commit, userId]
  );

  function ensureBudget(d: AppData, month: string): { data: AppData; budget: Budget; created: boolean } {
    const existing = d.budgets.find((b) => b.month === month);
    if (existing) return { data: d, budget: existing, created: false };
    const budget: Budget = {
      id: uid(),
      month,
      total_cap: null,
      created_at: new Date().toISOString(),
    };
    return { data: { ...d, budgets: [...d.budgets, budget] }, budget, created: true };
  }

  const setMonthlyCap: Store["setMonthlyCap"] = useCallback(
    (month, total_cap) => {
      const d0 = dataRef.current;
      const { data: d1, budget } = ensureBudget(d0, month);
      const updated: Budget = { ...budget, total_cap };
      const next = {
        ...d1,
        budgets: d1.budgets.map((b) => (b.id === budget.id ? updated : b)),
      };
      commit(next, [
        { kind: "upsert", table: TABLES.budgets, id: updated.id, row: budgetRow(updated, userId) },
      ]);
    },
    [commit, userId]
  );

  const setCategoryCap: Store["setCategoryCap"] = useCallback(
    (month, category_id, cap) => {
      const d0 = dataRef.current;
      const { data: d1, budget, created } = ensureBudget(d0, month);
      const ops: SyncOp[] = [];
      if (created) {
        ops.push({ kind: "upsert", table: TABLES.budgets, id: budget.id, row: budgetRow(budget, userId) });
      }
      const existing = d1.categoryBudgets.find(
        (cb) => cb.budget_id === budget.id && cb.category_id === category_id
      );
      let categoryBudgets: CategoryBudget[];
      if (cap === null || cap <= 0) {
        categoryBudgets = d1.categoryBudgets.filter((cb) => cb !== existing);
        if (existing) ops.push({ kind: "delete", table: TABLES.categoryBudgets, id: existing.id });
      } else if (existing) {
        const merged = { ...existing, cap };
        categoryBudgets = d1.categoryBudgets.map((cb) => (cb.id === existing.id ? merged : cb));
        ops.push({ kind: "upsert", table: TABLES.categoryBudgets, id: merged.id, row: categoryBudgetRow(merged, userId) });
      } else {
        const created2: CategoryBudget = { id: uid(), budget_id: budget.id, category_id, cap };
        categoryBudgets = [...d1.categoryBudgets, created2];
        ops.push({ kind: "upsert", table: TABLES.categoryBudgets, id: created2.id, row: categoryBudgetRow(created2, userId) });
      }
      commit({ ...d1, categoryBudgets }, ops);
    },
    [commit, userId]
  );

  const addTemplate: Store["addTemplate"] = useCallback(
    (input) => {
      const d = dataRef.current;
      const t: Template = { ...input, id: uid() };
      commit({ ...d, templates: [...d.templates, t] }, [
        { kind: "upsert", table: TABLES.templates, id: t.id, row: templateRow(t, userId) },
      ]);
    },
    [commit, userId]
  );

  const updateTemplate: Store["updateTemplate"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      const existing = d.templates.find((t) => t.id === id);
      if (!existing) return;
      const merged: Template = { ...existing, ...patch };
      commit(
        { ...d, templates: d.templates.map((t) => (t.id === id ? merged : t)) },
        [{ kind: "upsert", table: TABLES.templates, id, row: templateRow(merged, userId) }]
      );
    },
    [commit, userId]
  );

  const deleteTemplate: Store["deleteTemplate"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({ ...d, templates: d.templates.filter((t) => t.id !== id) }, [
        { kind: "delete", table: TABLES.templates, id },
      ]);
    },
    [commit]
  );

  const resetAll: Store["resetAll"] = useCallback(() => {
    const d = dataRef.current;
    // Fresh ids for the restored defaults so the inserts can't collide with any
    // existing row (by id or, after the deletes below, by name).
    const fresh = freshSeedCategories();
    const ops: SyncOp[] = [];
    if (syncEnabled) {
      for (const e of d.expenses) ops.push({ kind: "delete", table: TABLES.expenses, id: e.id });
      for (const cb of d.categoryBudgets) ops.push({ kind: "delete", table: TABLES.categoryBudgets, id: cb.id });
      for (const b of d.budgets) ops.push({ kind: "delete", table: TABLES.budgets, id: b.id });
      for (const t of d.templates) ops.push({ kind: "delete", table: TABLES.templates, id: t.id });
      // Drop every existing category before re-seeding. Safe because all rows
      // that reference a category (expenses, category budgets, templates) were
      // queued for deletion above, and the deletes run before the inserts.
      for (const c of d.categories) ops.push({ kind: "delete", table: TABLES.categories, id: c.id });
      for (const c of fresh) ops.push({ kind: "upsert", table: TABLES.categories, id: c.id, row: categoryRow(c, userId) });
    }
    commit({ ...emptyData(), categories: fresh }, ops);
  }, [commit, syncEnabled, userId]);

  const syncNow = useCallback(() => void flush(), [flush]);

  const value = useMemo<Store>(
    () => ({
      ready,
      data,
      syncStatus,
      pendingCount,
      syncNow,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      addCategory,
      updateCategory,
      archiveCategory,
      setMonthlyCap,
      setCategoryCap,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      resetAll,
    }),
    [
      ready,
      data,
      syncStatus,
      pendingCount,
      syncNow,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      addCategory,
      updateCategory,
      archiveCategory,
      setMonthlyCap,
      setCategoryCap,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useCurrentMonth() {
  return monthStart();
}
