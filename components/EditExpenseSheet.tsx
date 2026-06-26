"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Category, Expense } from "@/lib/types";
import { activeCategories } from "@/lib/selectors";
import { CategoryChip } from "./CategoryChip";

export function EditExpenseSheet({
  expense,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Expense>) => void;
  onDelete: (expense: Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategoryId(expense.category_id);
      setNote(expense.note ?? "");
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
            className="fixed inset-0 z-20 mx-auto max-w-col bg-black/55"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-col rounded-t-[20px] border-t border-white/10 bg-surface px-[18px] pb-[26px] pt-[18px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Edit expense</span>
              <button onClick={onClose} className="text-[13px] text-muted">
                Done
              </button>
            </div>

            {/* Amount */}
            <div className="mt-4 flex h-[54px] items-center gap-2 rounded-xl border border-hairline bg-elevated px-3.5">
              <span className="font-mono text-xl text-muted">₹</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                className="tnum min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none"
              />
            </div>

            {/* Category chips */}
            <div className="no-scrollbar mt-[13px] flex gap-[7px] overflow-x-auto">
              {cats.map((c) => (
                <CategoryChip
                  key={c.id}
                  category={c}
                  active={c.id === categoryId}
                  onClick={() => setCategoryId(c.id)}
                />
              ))}
            </div>

            {/* Note */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              className="mt-[13px] h-[46px] w-full rounded-xl border border-hairline bg-elevated px-3.5 text-sm outline-none placeholder:text-[#45454c]"
            />

            {/* Actions */}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => onDelete(expense)}
                className="h-12 shrink-0 rounded-xl border border-over/40 px-5 text-[15px] text-over"
              >
                Delete
              </button>
              <button
                onClick={save}
                className="h-12 flex-1 rounded-xl bg-accent text-[15px] font-semibold text-accent-ink"
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
