"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useStore, useCurrentMonth } from "@/lib/store";
import {
  budgetStatus,
  categoriesById,
  categoriesByWeekFrequency,
  lastUsedCategoryId,
} from "@/lib/selectors";
import { parseInput } from "@/lib/nlp";
import { rupees, todayISO } from "@/lib/format";
import { BudgetHeader } from "@/components/BudgetHeader";
import { CategoryChip } from "@/components/CategoryChip";
import { ExpenseRow } from "@/components/ExpenseRow";
import { EditExpenseSheet } from "@/components/EditExpenseSheet";
import { useToast } from "@/components/Toast";
import type { Expense } from "@/lib/types";
import { Zap } from "lucide-react";

export default function HomePage() {
  const { ready, data, addExpense, deleteExpense, restoreExpense, updateExpense } =
    useStore();
  const toast = useToast();
  const month = useCurrentMonth();

  const [raw, setRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const byId = useMemo(() => categoriesById(data.categories), [data.categories]);
  const lastUsed = useMemo(() => lastUsedCategoryId(data.expenses), [data.expenses]);
  const chips = useMemo(
    () => categoriesByWeekFrequency(data.categories, data.expenses),
    [data.categories, data.expenses]
  );
  const status = useMemo(() => budgetStatus(data, month), [data, month]);
  const monthLabel = new Date(month + "T00:00:00").toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  // Default selected chip: last-used, else first chip.
  const effectiveCategoryId = categoryId ?? lastUsed ?? chips[0]?.id ?? null;

  // Live parse preview from the NLP box.
  const preview = useMemo(
    () => parseInput(raw, data.categories, lastUsed),
    [raw, data.categories, lastUsed]
  );

  // Templates due within 3 days of their default_day, surfaced as suggestions.
  const suggestions = useMemo(() => {
    const today = new Date().getDate();
    return data.templates.filter((t) => {
      if (t.default_day == null) return false;
      const diff = t.default_day - today;
      return diff >= 0 && diff <= 3;
    });
  }, [data.templates]);

  function onRawChange(v: string) {
    setRaw(v);
    const p = parseInput(v, data.categories, lastUsed);
    if (p.amount != null) setAmount(String(p.amount));
    if (p.categoryId) setCategoryId(p.categoryId);
    setNote(p.note ?? "");
    if (p.note) setShowNote(true);
  }

  function commit() {
    const amt = parseFloat(amount);
    const cat = effectiveCategoryId;
    if (!amt || amt <= 0 || !cat) {
      toast.show("Enter an amount and pick a category");
      return;
    }
    addExpense({ amount: amt, category_id: cat, note: note.trim() || null });
    // Reset the form for the next log.
    setRaw("");
    setAmount("");
    setNote("");
    setShowNote(false);
    setCategoryId(null);
    toast.show(`Logged ${rupees(amt)}`);
  }

  function logTemplate(amount: number, category_id: string, label: string) {
    addExpense({ amount, category_id, note: null });
    toast.show(`Logged ${label} ${rupees(amount)}`);
  }

  function onDelete(exp: Expense) {
    deleteExpense(exp.id);
    toast.show("Expense deleted", {
      actionLabel: "Undo",
      onAction: () => restoreExpense(exp),
    });
  }

  const recent = data.expenses.slice(0, 30);

  if (!ready) {
    return <div className="py-20 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div>
      {status && <BudgetHeader status={status} month={month} />}

      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Spendr</h1>
          <p className="text-xs text-muted">{monthLabel}</p>
        </div>
        <span className="text-xs text-muted">{prettyDate(todayISO())}</span>
      </header>

      {/* Template suggestion chips */}
      {suggestions.length > 0 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {suggestions.map((t) => (
            <button
              key={t.id}
              onClick={() => logTemplate(t.amount, t.category_id, t.label)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-accent-dim bg-accent/10 px-3 text-xs font-medium text-accent"
            >
              <Zap size={13} />
              {t.label} · {rupees(t.amount)}
            </button>
          ))}
        </div>
      )}

      {/* Quick-add: the visual anchor of the home screen. */}
      <section className="rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
        <input
          value={raw}
          onChange={(e) => onRawChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          placeholder="400 dinner"
          autoFocus
          className="w-full rounded-xl bg-elevated px-4 py-3 text-base outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
        />

        {/* Parse preview line */}
        <div className="mt-2 min-h-[20px] px-1 text-sm">
          {raw.trim() && preview.amount != null ? (
            <span className="text-muted">
              <span className="tnum text-fg">{rupees(preview.amount)}</span>
              {preview.categoryId && (
                <> · {byId[preview.categoryId]?.name ?? "Other"}</>
              )}
              {preview.note && <> · {preview.note}</>}
            </span>
          ) : (
            <span className="text-muted">Type an amount and a word, e.g. 400 dinner</span>
          )}
        </div>

        {/* Manual amount */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-xl bg-elevated px-4">
            <span className="text-muted">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder="0"
              className="tnum w-full bg-transparent py-3 pl-2 text-lg outline-none placeholder:text-muted"
            />
          </div>
          <button
            onClick={commit}
            className="h-tap shrink-0 rounded-xl bg-accent px-5 font-semibold text-bg active:scale-[0.98]"
          >
            Add
          </button>
        </div>

        {/* Category chips, ordered by most-frequent-this-week */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {chips.map((c) => (
            <CategoryChip
              key={c.id}
              category={c}
              active={c.id === effectiveCategoryId}
              onClick={() => setCategoryId(c.id)}
            />
          ))}
        </div>

        {/* Collapsed note */}
        {showNote ? (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="Add a note"
            className="mt-3 w-full rounded-xl bg-elevated px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
          />
        ) : (
          <button
            onClick={() => setShowNote(true)}
            className="mt-2 px-1 text-xs text-muted"
          >
            + Add note
          </button>
        )}
      </section>

      {/* Recent list */}
      <section className="mt-6">
        <h2 className="mb-1 px-1 text-xs uppercase tracking-wide text-muted">
          Recent
        </h2>
        {recent.length === 0 ? (
          <p className="px-1 py-8 text-sm text-muted">
            No expenses yet. Log your first one above, try typing 400 dinner.
          </p>
        ) : (
          <div>
            <AnimatePresence initial={false}>
              {recent.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  category={byId[e.category_id]}
                  onEdit={() => setEditing(e)}
                  onDelete={() => onDelete(e)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <EditExpenseSheet
        expense={editing}
        categories={data.categories}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => updateExpense(id, patch)}
      />
    </div>
  );
}

function prettyDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
