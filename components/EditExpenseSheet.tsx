"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Category, Expense } from "@/lib/types";
import { activeCategories } from "@/lib/selectors";
import { hexA } from "./CategoryChip";
import { cn } from "@/lib/cn";

export function EditExpenseSheet({
  expense,
  categories,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Expense>) => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [spentAt, setSpentAt] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategoryId(expense.category_id);
      setNote(expense.note ?? "");
      setSpentAt(expense.spent_at);
    }
  }, [expense]);

  const cats = activeCategories(categories);

  function save() {
    if (!expense) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave(expense.id, {
      amount: amt,
      category_id: categoryId,
      note: note.trim() || null,
      spent_at: spentAt,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {expense && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-col rounded-t-2xl border-t border-hairline bg-surface p-4 pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline" />
            <h2 className="mb-4 text-base font-semibold">Edit expense</h2>

            <label className="mb-1 block text-xs text-muted">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tnum mb-4 w-full rounded-xl border border-hairline bg-elevated px-4 py-3 text-lg outline-none focus:border-accent"
            />

            <label className="mb-1 block text-xs text-muted">Category</label>
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
              {cats.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "h-tap shrink-0 rounded-full border px-4 text-sm font-medium",
                      active ? "" : "text-muted"
                    )}
                    style={{
                      backgroundColor: active ? hexA(c.color, 0.18) : hexA(c.color, 0.08),
                      borderColor: active ? c.color : "transparent",
                      color: active ? c.color : undefined,
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            <label className="mb-1 block text-xs text-muted">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="optional"
              className="mb-4 w-full rounded-xl border border-hairline bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            />

            <label className="mb-1 block text-xs text-muted">Date</label>
            <input
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="tnum mb-5 w-full rounded-xl border border-hairline bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="h-tap flex-1 rounded-xl border border-hairline text-sm font-medium text-muted"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="h-tap flex-1 rounded-xl bg-accent text-sm font-semibold text-bg"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
