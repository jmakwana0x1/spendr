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
import { rupees } from "@/lib/format";
import { BudgetHeader } from "@/components/BudgetHeader";
import { CategoryChip } from "@/components/CategoryChip";
import { ExpenseRow } from "@/components/ExpenseRow";
import { EditExpenseSheet } from "@/components/EditExpenseSheet";
import { useToast } from "@/components/Toast";
import type { Expense } from "@/lib/types";
import { Plus } from "lucide-react";

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

  const effectiveCategoryId = categoryId ?? lastUsed ?? chips[0]?.id ?? null;

  const preview = useMemo(
    () => parseInput(raw, data.categories, lastUsed),
    [raw, data.categories, lastUsed]
  );
  const showParsed = raw.trim().length > 0 && preview.amount != null;
  const parsedCat = preview.categoryId ? byId[preview.categoryId] : null;

  // Templates due within 3 days of their default_day, surfaced as suggestions.
  const suggestions = useMemo(() => {
    const today = new Date().getDate();
    return data.templates.filter((t) => {
      if (t.default_day == null) return false;
      const diff = t.default_day - today;
      return diff >= -1 && diff <= 3;
    });
  }, [data.templates]);

  function onRawChange(v: string) {
    setRaw(v);
    const p = parseInput(v, data.categories, lastUsed);
    if (p.amount != null) setAmount(String(p.amount));
    else if (v === "") setAmount("");
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
    setRaw("");
    setAmount("");
    setNote("");
    setShowNote(false);
    setCategoryId(null);
  }

  function logTemplate(amount: number, category_id: string, label: string) {
    addExpense({ amount, category_id, note: null });
    toast.show(`${label} logged`);
  }

  function onDelete(exp: Expense) {
    deleteExpense(exp.id);
    setEditing(null);
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
    <div className={status ? undefined : "pt-[22px]"}>
      {status && <BudgetHeader status={status} month={month} />}

      {/* Template suggestion chips */}
      {suggestions.length > 0 && (
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {suggestions.map((t) => (
            <button
              key={t.id}
              onClick={() => logTemplate(t.amount, t.category_id, t.label)}
              className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[11px] border border-hairline bg-surface px-[13px]"
            >
              <span
                className="h-[7px] w-[7px] rounded-sm"
                style={{ backgroundColor: byId[t.category_id]?.color ?? "#86868f" }}
              />
              <span className="text-[13px] text-fg">{t.label}</span>
              <span className="tnum text-[13px] text-muted">{rupees(t.amount)}</span>
              <span className="ml-0.5 text-base font-semibold leading-none text-accent">+</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick-add: the visual anchor of the home screen. */}
      <section className="mt-[13px] rounded-2xl border border-hairline bg-surface p-[15px] shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
        {/* Smart NLP input */}
        <div className="flex h-12 items-center gap-2.5 rounded-[11px] border border-hairline bg-elevated px-3.5 focus-within:border-accent">
          <span className="font-mono text-base leading-none text-accent" aria-hidden>
            &rsaquo;
          </span>
          <input
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="400 dinner"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#45454c]"
          />
        </div>

        {/* Parse preview */}
        <div className="mt-2.5 flex min-h-[18px] items-center gap-2 text-[13px] text-muted">
          {showParsed ? (
            <>
              <span className="text-[11px] uppercase tracking-[0.06em] text-accent">
                Parsed
              </span>
              <span className="tnum text-fg">{rupees(preview.amount ?? 0)}</span>
              <span className="text-faint">·</span>
              <span
                className="h-1.5 w-1.5 rounded-sm"
                style={{ backgroundColor: parsedCat?.color ?? "#86868f" }}
              />
              <span className="text-fg">{parsedCat?.name ?? "Other"}</span>
              {preview.note && (
                <>
                  <span className="text-faint">·</span>
                  <span className="truncate">{preview.note}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-faint">Type an amount, or pick a category below</span>
          )}
        </div>

        {/* Manual amount */}
        <div className="mt-[13px] flex h-[52px] items-center gap-2.5 rounded-[11px] border border-hairline bg-elevated px-3.5">
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted">Amount</span>
          <span className="h-[22px] w-px bg-white/[0.08]" />
          <span className="font-mono text-lg text-muted">₹</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="0"
            className="tnum min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-[#45454c]"
          />
        </div>

        {/* Category chips */}
        <div className="no-scrollbar mt-[13px] flex gap-[7px] overflow-x-auto">
          {chips.map((c) => (
            <CategoryChip
              key={c.id}
              category={c}
              active={c.id === effectiveCategoryId}
              onClick={() => setCategoryId(c.id)}
            />
          ))}
        </div>

        {/* Add note */}
        <div className="mt-[13px]">
          {showNote ? (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder="Add a note"
              className="h-11 w-full rounded-[11px] border border-hairline bg-elevated px-3.5 text-sm outline-none placeholder:text-[#45454c]"
            />
          ) : (
            <button
              onClick={() => setShowNote(true)}
              className="py-1 text-[13px] text-muted"
            >
              + Add note
            </button>
          )}
        </div>

        {/* Commit */}
        <button
          onClick={commit}
          className="mt-3.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-[11px] bg-accent font-semibold text-accent-ink active:scale-[0.99]"
        >
          <Plus size={17} strokeWidth={2.4} />
          Add expense
        </button>
      </section>

      {/* Recent */}
      <div className="flex items-baseline justify-between px-0 pb-1 pt-[18px]">
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted">Recent</span>
        <span className="text-xs text-faint">Last {recent.length}</span>
      </div>
      {recent.length === 0 ? (
        <p className="py-6 text-sm text-muted">
          No expenses yet. Try typing &quot;120 coffee&quot; above.
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
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <EditExpenseSheet
        expense={editing}
        categories={data.categories}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => updateExpense(id, patch)}
        onDelete={onDelete}
      />
    </div>
  );
}
