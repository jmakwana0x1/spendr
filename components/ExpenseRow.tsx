"use client";

import { motion } from "framer-motion";
import type { Category, Expense } from "@/lib/types";
import { rupees } from "@/lib/format";

// Square color dot, note as the title, "Category · time" muted beneath, amount
// right-aligned in tabular Geist Mono. The whole row opens the edit sheet.
export function ExpenseRow({
  expense,
  category,
  onEdit,
}: {
  expense: Expense;
  category: Category | undefined;
  onEdit: () => void;
}) {
  const color = category?.color ?? "#86868f";
  const name = category?.name ?? "Unknown";
  const meta = `${name} · ${metaTime(expense)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onEdit}
      className="flex min-h-[50px] cursor-pointer items-center gap-3 border-t border-white/[0.05]"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-fg">{expense.note || name}</div>
        <div className="text-xs text-faint">{meta}</div>
      </div>
      <span className="tnum shrink-0 text-[15px] text-fg">{rupees(expense.amount)}</span>
    </motion.div>
  );
}

// Today shows the time of day; older entries show the short date.
function metaTime(expense: Expense): string {
  const created = expense.created_at ? new Date(expense.created_at) : null;
  const day = new Date(expense.spent_at + "T00:00:00");
  const isToday = day.toDateString() === new Date().toDateString();
  if (isToday && created) {
    return created.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  }
  return day.toLocaleDateString("en", { day: "numeric", month: "short" });
}
