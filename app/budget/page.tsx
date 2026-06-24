"use client";

import { useMemo, useState } from "react";
import { useStore, useCurrentMonth } from "@/lib/store";
import {
  activeCategories,
  budgetForMonth,
  categoryBreakdown,
  monthTotal,
} from "@/lib/selectors";
import { formatMoney, rupees } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function BudgetPage() {
  const { ready, data, setMonthlyCap, setCategoryCap } = useStore();
  const month = useCurrentMonth();

  const budget = useMemo(() => budgetForMonth(data.budgets, month), [data.budgets, month]);
  const enabled = budget?.total_cap != null;
  const spent = useMemo(() => monthTotal(data.expenses, month), [data.expenses, month]);
  const breakdown = useMemo(() => categoryBreakdown(data, month), [data, month]);
  const spentByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of breakdown) m[b.id] = b.total;
    return m;
  }, [breakdown]);

  const [capInput, setCapInput] = useState("");

  const catBudgets = useMemo(() => {
    if (!budget) return {} as Record<string, number>;
    const m: Record<string, number> = {};
    for (const cb of data.categoryBudgets) {
      if (cb.budget_id === budget.id) m[cb.category_id] = cb.cap;
    }
    return m;
  }, [data.categoryBudgets, budget]);

  if (!ready) return <div className="py-20 text-center text-sm text-muted">Loading…</div>;

  function toggle() {
    if (enabled) {
      setMonthlyCap(month, null);
    } else {
      const v = parseFloat(capInput);
      setMonthlyCap(month, v > 0 ? v : 0);
    }
  }

  const cap = budget?.total_cap ?? 0;
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Budget</h1>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Monthly budget</p>
            <p className="text-xs text-muted">
              {new Date(month + "T00:00:00").toLocaleString("en", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={toggle}
            className={cn(
              "h-tap rounded-xl px-4 text-sm font-semibold",
              enabled
                ? "border border-hairline text-muted"
                : "bg-accent text-bg"
            )}
          >
            {enabled ? "Turn off" : "Turn on"}
          </button>
        </div>

        {!enabled ? (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 items-center rounded-xl bg-elevated px-4">
              <span className="text-muted">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                placeholder="Set a monthly cap"
                className="tnum w-full bg-transparent py-3 pl-2 text-lg outline-none placeholder:text-muted"
              />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="tnum text-fg">{rupees(spent)}</span>
              <span className="tnum text-muted">of {rupees(cap)}</span>
            </div>
            <Bar pct={pct} over={spent > cap} />
            <div className="mt-3 flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-xl bg-elevated px-4">
                <span className="text-muted">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  defaultValue={cap}
                  key={cap}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    if (v > 0) setMonthlyCap(month, v);
                  }}
                  className="tnum w-full bg-transparent py-2.5 pl-2 text-base outline-none"
                />
              </div>
              <span className="text-xs text-muted">edit cap</span>
            </div>
          </div>
        )}
      </section>

      {enabled && (
        <section>
          <h2 className="mb-2 px-1 text-xs uppercase tracking-wide text-muted">
            Per-category caps (optional)
          </h2>
          <div className="space-y-2">
            {activeCategories(data.categories).map((c) => {
              const catCap = catBudgets[c.id];
              const catSpent = spentByCat[c.id] ?? 0;
              const catPct = catCap ? Math.min(100, (catSpent / catCap) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-hairline bg-surface p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <div className="flex items-center rounded-lg bg-elevated px-2">
                      <span className="text-xs text-muted">₹</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        defaultValue={catCap ?? ""}
                        key={catCap ?? "none"}
                        placeholder="cap"
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          setCategoryCap(month, c.id, isNaN(v) ? null : v);
                        }}
                        className="tnum w-20 bg-transparent py-1.5 pl-1 text-sm outline-none placeholder:text-muted"
                      />
                    </div>
                  </div>
                  {catCap ? (
                    <div className="mt-2">
                      <Bar pct={catPct} over={catSpent > catCap} thin />
                      <p className="tnum mt-1 text-xs text-muted">
                        {formatMoney(catSpent)} of {formatMoney(catCap)}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Bar({ pct, over, thin }: { pct: number; over?: boolean; thin?: boolean }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-elevated", thin ? "h-1.5" : "h-2.5")}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: over ? "#F26D6D" : "#34D399",
        }}
      />
    </div>
  );
}
