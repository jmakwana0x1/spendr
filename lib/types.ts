export type Category = {
  id: string;
  name: string;
  color: string; // hex, for chips and charts
  keywords: string[]; // for NLP matching
  icon: string; // lucide icon name
  sort_order: number;
  is_archived: boolean;
};

export type Expense = {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  spent_at: string; // ISO date, YYYY-MM-DD
  created_at: string; // ISO timestamp
  synced: boolean; // client-side flag only
};

export type Budget = {
  id: string;
  month: string; // first day of month, YYYY-MM-01
  total_cap: number | null; // nullable: monthly budget is optional
  created_at: string;
};

export type CategoryBudget = {
  id: string;
  budget_id: string;
  category_id: string;
  cap: number;
};

export type Template = {
  id: string;
  label: string;
  amount: number;
  category_id: string;
  default_day: number | null; // 1-31
};

export type AppData = {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  categoryBudgets: CategoryBudget[];
  templates: Template[];
};

export type ParseResult = {
  amount: number | null;
  categoryId: string | null;
  note: string | null;
};
