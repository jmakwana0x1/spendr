import type { AppData, Expense } from "./types";
import { categoriesById } from "./selectors";

export type ExpenseFilter = {
  categoryId?: string | null;
  from?: string | null; // ISO date inclusive
  to?: string | null; // ISO date inclusive
  note?: string | null; // substring match
};

export function filterExpenses(expenses: Expense[], f: ExpenseFilter): Expense[] {
  const note = f.note?.trim().toLowerCase();
  return expenses.filter((e) => {
    if (f.categoryId && e.category_id !== f.categoryId) return false;
    if (f.from && e.spent_at < f.from) return false;
    if (f.to && e.spent_at > f.to) return false;
    if (note && !(e.note ?? "").toLowerCase().includes(note)) return false;
    return true;
  });
}

function escape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function toCSV(data: AppData, filter: ExpenseFilter): string {
  const byId = categoriesById(data.categories);
  const rows = filterExpenses(data.expenses, filter).sort((a, b) =>
    a.spent_at < b.spent_at ? 1 : -1
  );
  const header = ["date", "amount", "category", "note"];
  const lines = [header.join(",")];
  for (const e of rows) {
    lines.push(
      [
        e.spent_at,
        String(e.amount),
        escape(byId[e.category_id]?.name ?? "Unknown"),
        escape(e.note ?? ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
