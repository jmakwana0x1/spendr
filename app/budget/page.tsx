"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, useCurrentMonth } from "@/lib/store";
import {
  activeCategories,
  budgetForMonth,
  categoryBreakdown,
  monthTotal,
} from "@/lib/selectors";
import { formatMoney } from "@/lib/format";

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

  const catBudgets = useMemo(() => {
    if (!budget) return {} as Record<string, number>;
    const m: Record<string, number> = {};
    for (const cb of data.categoryBudgets) {
      if (cb.budget_id === budget.id) m[cb.category_id] = cb.cap;
    }
    return m;
  }, [data.categoryBudgets, budget]);

  const [addOpen, setAddOpen] = useState(false);

  const cap = budget?.total_cap ?? 0;
  // Local editing string for the total-cap field. Kept controlled so the input
  // never remounts while typing; synced down only when the stored cap changes
  // from outside this field (e.g. toggling the budget on/off).
  const [capStr, setCapStr] = useState(() => (cap > 0 ? String(cap) : ""));
  useEffect(() => {
    const parsed = capStr === "" ? 0 : parseInt(capStr, 10);
    if (parsed !== cap) setCapStr(cap > 0 ? String(cap) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap]);

  if (!ready) return <div className="py-20 text-center text-sm text-muted">Loading…</div>;

  const capPct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const left = cap - spent;
  const cats = activeCategories(data.categories);
  const capped = cats.filter((c) => catBudgets[c.id] != null);
  const uncapped = cats.filter((c) => catBudgets[c.id] == null);

  return (
    <div className="pt-[22px]">
      <div className="flex items-center justify-between">
        <span className="text-[21px] font-semibold tracking-[-0.01em]">Budget</span>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-muted">Monthly budget</span>
          <button
            onClick={() => setMonthlyCap(month, enabled ? null : 30000)}
            className="relative h-[26px] w-11 rounded-[13px] transition-colors"
            style={{ background: enabled ? "#34d39e" : "#2a2a31" }}
            aria-label="Toggle monthly budget"
          >
            <span
              className="absolute top-[3px] h-5 w-5 rounded-full transition-[left] duration-150"
              style={{ left: enabled ? "21px" : "3px", background: enabled ? "#06120d" : "#86868f" }}
            />
          </button>
        </div>
      </div>

      {!enabled ? (
        <p className="mt-[18px] text-sm text-muted">
          No budget set. Turn it on to track a monthly cap and per-category limits.
        </p>
      ) : (
        <>
          {/* Total cap */}
          <div className="mt-3.5 rounded-[14px] border border-hairline bg-surface p-4">
            <div className="text-[11px] uppercase tracking-[0.06em] text-muted">Total cap</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono text-xl text-muted">₹</span>
              <input
                inputMode="numeric"
                value={capStr}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setCapStr(v);
                  setMonthlyCap(month, v ? parseInt(v, 10) : 0);
                }}
                className="tnum w-[150px] border-b border-white/[0.12] bg-transparent pb-0.5 text-[30px] font-semibold outline-none"
              />
              <span className="ml-1 text-[13px] text-faint">/ month</span>
            </div>
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-md bg-white/[0.08]">
              <div
                className="h-full rounded-md"
                style={{ width: `${capPct}%`, background: capPct >= 100 ? "#f87171" : "#34d39e" }}
              />
            </div>
            <div className="mt-[7px] flex justify-between">
              <span className="tnum text-xs text-muted">{formatMoney(spent)} spent</span>
              <span
                className="tnum text-xs"
                style={{ color: left < 0 ? "#f87171" : "#34d39e" }}
              >
                {formatMoney(Math.abs(left))} {left < 0 ? "over" : "left"}
              </span>
            </div>
          </div>

          {/* Per-category caps */}
          <div className="pb-1.5 pt-[18px] text-[11px] uppercase tracking-[0.1em] text-muted">
            Per-category caps
          </div>
          <div className="flex flex-col gap-3.5">
            {capped.map((c) => {
              const catCap = catBudgets[c.id];
              const catSpent = spentByCat[c.id] ?? 0;
              const over = catSpent > catCap;
              const pct = catCap > 0 ? Math.min(100, (catSpent / catCap) * 100) : 0;
              return (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="h-[7px] w-[7px] rounded-sm"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <span
                      className="tnum text-[13px]"
                      style={{ color: over ? "#f87171" : "#86868f" }}
                    >
                      {formatMoney(catSpent)} / {formatMoney(catCap)}
                    </span>
                  </div>
                  <div className="mt-[7px] h-[5px] overflow-hidden rounded-[5px] bg-white/[0.07]">
                    <div
                      className="h-full rounded-[5px]"
                      style={{ width: `${pct}%`, background: over ? "#f87171" : c.color }}
                    />
                  </div>
                  <button
                    onClick={() => setCategoryCap(month, c.id, null)}
                    className="mt-1 text-[11px] text-faint"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            {capped.length === 0 && (
              <p className="text-[13px] text-faint">No category caps yet.</p>
            )}
          </div>

          {!addOpen ? (
            <button
              onClick={() => setAddOpen(true)}
              className="mt-[18px] w-full rounded-xl border border-dashed border-white/[0.14] p-[13px] text-center text-[13px] text-muted"
            >
              + Add category cap
            </button>
          ) : (
            <div className="mt-[18px] flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface p-3.5">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted">Set a cap</div>
              {uncapped.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="h-[7px] w-[7px] rounded-sm" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <div className="flex items-center rounded-lg border border-hairline bg-elevated px-2.5">
                    <span className="text-xs text-muted">₹</span>
                    <input
                      inputMode="numeric"
                      placeholder="cap"
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value.replace(/[^\d]/g, ""));
                        if (v > 0) {
                          setCategoryCap(month, c.id, v);
                          setAddOpen(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="tnum w-20 bg-transparent py-1.5 pl-1 text-sm outline-none placeholder:text-[#45454c]"
                    />
                  </div>
                </div>
              ))}
              {uncapped.length === 0 && (
                <p className="text-[13px] text-faint">All categories have caps.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
