"use client";

import { motion } from "framer-motion";
import type { Category, Expense } from "@/lib/types";
import { rupees } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";

// Amount right-aligned and tabular, category dot + name left, note muted,
// date subtle. No card borders: hairline row separation.
export function ExpenseRow({
  expense,
  category,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  category: Category | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = category?.color ?? "#8B8F99";
  const d = new Date(expense.spent_at + "T00:00:00");
  const dateLabel = d.toLocaleDateString("en", { day: "numeric", month: "short" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group flex items-center gap-3 border-b border-hairline py-3"
    >
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 self-start rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-fg">{category?.name ?? "Unknown"}</span>
          <span className="tnum shrink-0 font-semibold text-fg">
            {rupees(expense.amount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm text-muted">
            {expense.note || " "}
          </span>
          <span className="shrink-0 text-xs text-muted">{dateLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          onClick={onEdit}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-fg"
          aria-label="Edit expense"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-over"
          aria-label="Delete expense"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}
