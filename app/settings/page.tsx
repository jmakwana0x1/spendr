"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { activeCategories, categoriesById } from "@/lib/selectors";
import { toCSV, downloadCSV, filterExpenses, type ExpenseFilter } from "@/lib/csv";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Category, Template } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import type { SyncStatus } from "@/lib/store";

export default function SettingsPage() {
  const { ready } = useStore();
  if (!ready) return <div className="py-20 text-center text-sm text-muted">Loading…</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Settings</h1>
        <SyncBadge />
      </div>
      <Section title="Account" defaultOpen>
        <AccountPanel />
      </Section>
      <Section title="Categories">
        <CategoryManager />
      </Section>
      <Section title="Templates">
        <TemplateManager />
      </Section>
      <Section title="Export & filter">
        <ExportPanel />
      </Section>
      <Section title="Data">
        <DataPanel />
      </Section>
    </div>
  );
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: "Local only",
  synced: "Synced",
  pending: "Pending",
  syncing: "Syncing…",
  error: "Sync error",
};

const SYNC_COLOR: Record<SyncStatus, string> = {
  off: "text-muted",
  synced: "text-accent",
  pending: "text-muted",
  syncing: "text-muted",
  error: "text-over",
};

function SyncBadge() {
  const { syncStatus, pendingCount, syncNow } = useStore();
  return (
    <button
      onClick={syncNow}
      className={`flex items-center gap-1.5 text-xs ${SYNC_COLOR[syncStatus]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {SYNC_LABEL[syncStatus]}
      {pendingCount > 0 && syncStatus !== "synced" ? ` (${pendingCount})` : ""}
    </button>
  );
}

function AccountPanel() {
  const { enabled, user, signInWithGoogle, signOut } = useAuth();
  if (!enabled) {
    return (
      <p className="text-sm text-muted">
        Cloud sync is off. Data is stored on this device only. Add Supabase keys to
        .env.local to enable Google sign-in and sync.
      </p>
    );
  }
  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="h-tap w-full rounded-xl bg-accent text-sm font-semibold text-bg"
      >
        Continue with Google
      </button>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-fg">{user.email ?? "Signed in"}</p>
        <p className="text-xs text-muted">Synced to Supabase</p>
      </div>
      <button
        onClick={signOut}
        className="h-10 shrink-0 rounded-xl border border-hairline px-4 text-sm font-medium text-muted"
      >
        Sign out
      </button>
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section className="rounded-2xl border border-hairline bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-hairline p-4">{children}</div>}
    </section>
  );
}

const PALETTE = [
  "#E0A458", "#5B9BD5", "#D17B7B", "#6FB58A", "#9B8BD5",
  "#C28FB0", "#D5A45B", "#6BC2B5", "#8B8F99", "#7FA8D5",
];

function CategoryManager() {
  const { data, addCategory, updateCategory, archiveCategory } = useStore();
  const cats = activeCategories(data.categories);
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-3">
      {cats.map((c) => (
        <CategoryEditor
          key={c.id}
          category={c}
          onChange={(patch) => updateCategory(c.id, patch)}
          onArchive={() => archiveCategory(c.id, true)}
        />
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-xl bg-elevated px-4 py-2.5 text-sm outline-none placeholder:text-muted"
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            addCategory({
              name: newName.trim(),
              color: PALETTE[cats.length % PALETTE.length],
              keywords: [],
              icon: "Circle",
            });
            setNewName("");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-bg"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function CategoryEditor({
  category,
  onChange,
  onArchive,
}: {
  category: Category;
  onChange: (patch: Partial<Category>) => void;
  onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-hairline bg-elevated p-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm"
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
          <Icon name={category.icon} size={15} className="text-muted" />
          {category.name}
        </button>
        <button onClick={onArchive} className="text-muted hover:text-over" aria-label="Archive">
          <Trash2 size={15} />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <Field label="Name">
            <input
              defaultValue={category.name}
              key={category.name}
              onBlur={(e) => e.target.value.trim() && onChange({ name: e.target.value.trim() })}
              className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none"
            />
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ color: p })}
                  className={`h-7 w-7 rounded-full ${category.color === p ? "ring-2 ring-fg ring-offset-2 ring-offset-elevated" : ""}`}
                  style={{ backgroundColor: p }}
                />
              ))}
            </div>
          </Field>
          <Field label="Icon (lucide name)">
            <input
              defaultValue={category.icon}
              key={category.icon}
              onBlur={(e) => e.target.value.trim() && onChange({ icon: e.target.value.trim() })}
              className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none"
            />
          </Field>
          <Field label="Keywords (comma separated, used by the parser)">
            <input
              defaultValue={category.keywords.join(", ")}
              key={category.keywords.join(",")}
              onBlur={(e) =>
                onChange({
                  keywords: e.target.value
                    .split(",")
                    .map((k) => k.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function TemplateManager() {
  const { data, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const cats = activeCategories(data.categories);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(cats[0]?.id ?? "");
  const [day, setDay] = useState("");

  function add() {
    const amt = parseFloat(amount);
    if (!label.trim() || !amt || amt <= 0 || !categoryId) return;
    const d = parseInt(day, 10);
    addTemplate({
      label: label.trim(),
      amount: amt,
      category_id: categoryId,
      default_day: d >= 1 && d <= 31 ? d : null,
    });
    setLabel("");
    setAmount("");
    setDay("");
  }

  return (
    <div className="space-y-3">
      {data.templates.length === 0 && (
        <p className="text-sm text-muted">
          No templates. Add one for a recurring expense like rent to log it in one tap.
        </p>
      )}
      {data.templates.map((t) => (
        <TemplateRow
          key={t.id}
          template={t}
          categoryName={categoriesById(data.categories)[t.category_id]?.name ?? "?"}
          onDelete={() => deleteTemplate(t.id)}
          onDay={(d) => updateTemplate(t.id, { default_day: d })}
        />
      ))}

      <div className="space-y-2 rounded-xl border border-hairline bg-elevated p-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label, e.g. Rent"
          className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted"
        />
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="tnum w-28 rounded-lg bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm outline-none"
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="Day"
            className="tnum w-16 rounded-lg bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
        <button onClick={add} className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-bg">
          Add template
        </button>
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  categoryName,
  onDelete,
  onDay,
}: {
  template: Template;
  categoryName: string;
  onDelete: () => void;
  onDay: (d: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-hairline bg-elevated p-3 text-sm">
      <div>
        <p className="font-medium">{template.label}</p>
        <p className="tnum text-xs text-muted">
          ₹{template.amount} · {categoryName}
          {template.default_day ? ` · day ${template.default_day}` : ""}
        </p>
      </div>
      <button onClick={onDelete} className="text-muted hover:text-over" aria-label="Delete template">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ExportPanel() {
  const { data } = useStore();
  const toast = useToast();
  const cats = activeCategories(data.categories);
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");

  const filter: ExpenseFilter = {
    categoryId: categoryId || null,
    from: from || null,
    to: to || null,
    note: note || null,
  };
  const count = useMemo(
    () => filterExpenses(data.expenses, filter).length,
    [data.expenses, categoryId, from, to, note]
  );

  return (
    <div className="space-y-3">
      <Field label="Category">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg bg-elevated px-3 py-2 text-sm outline-none"
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <Field label="From">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="tnum w-full rounded-lg bg-elevated px-3 py-2 text-sm outline-none"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="tnum w-full rounded-lg bg-elevated px-3 py-2 text-sm outline-none"
          />
        </Field>
      </div>
      <Field label="Note contains">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="substring"
          className="w-full rounded-lg bg-elevated px-3 py-2 text-sm outline-none placeholder:text-muted"
        />
      </Field>
      <button
        onClick={() => {
          if (count === 0) {
            toast.show("No expenses match the filter");
            return;
          }
          downloadCSV(`spendr-${todayISO()}.csv`, toCSV(data, filter));
          toast.show(`Exported ${count} expenses`);
        }}
        className="h-tap w-full rounded-xl bg-accent text-sm font-semibold text-bg"
      >
        Export CSV ({count})
      </button>
    </div>
  );
}

function DataPanel() {
  const { resetAll } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-2">
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="h-tap w-full rounded-xl border border-hairline text-sm font-medium text-over"
        >
          Reset all data
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            This erases every expense, budget, and template on this device. Categories
            reset to defaults.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirm(false)}
              className="h-tap flex-1 rounded-xl border border-hairline text-sm font-medium text-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAll();
                setConfirm(false);
                toast.show("All data reset");
              }}
              className="h-tap flex-1 rounded-xl bg-over text-sm font-semibold text-bg"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
