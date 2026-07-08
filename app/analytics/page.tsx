"use client";

import { useMemo, useState } from "react";
import { useStore, useCurrentMonth } from "@/lib/store";
import {
  categoriesById,
  categoryBreakdown,
  categoryDetail,
  categoryOverTime,
  monthSummary,
  monthlyTrend,
  spendPerDayOfWeek,
} from "@/lib/selectors";
import { rupees } from "@/lib/format";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function AnalyticsPage() {
  const { ready, data } = useStore();
  const month = useCurrentMonth();
  const [prevWeek, setPrevWeek] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const monthLabel = new Date(month + "T00:00:00").toLocaleString("en", {
    month: "long",
  });

  const week = useMemo(
    () => spendPerDayOfWeek(data.expenses, prevWeek ? -1 : 0),
    [data.expenses, prevWeek]
  );
  const trend = useMemo(() => monthlyTrend(data.expenses, 6), [data.expenses]);
  const breakdown = useMemo(() => categoryBreakdown(data, month), [data, month]);
  const detail = useMemo(() => categoryDetail(data, month), [data, month]);
  const overTime = useMemo(() => categoryOverTime(data, 4), [data]);
  const summary = useMemo(() => monthSummary(data, month), [data, month]);
  const byId = useMemo(() => categoriesById(data.categories), [data.categories]);

  if (!ready) return <div className="py-20 text-center text-sm text-muted">Loading…</div>;

  // Weekly bars
  const wkMax = Math.max(1, ...week.map((d) => d.total));
  const todayIdx = prevWeek ? -1 : (new Date().getDay() + 6) % 7;

  // 6-month trend polyline over a 320x80 viewBox
  const tVals = trend.map((t) => t.total);
  const tMax = Math.max(...tVals, 1);
  const tMin = Math.min(...tVals);
  const trendPoints = trend
    .map((t, i) => {
      const x = (i / Math.max(1, trend.length - 1)) * 320;
      const y = 72 - ((t.total - tMin) / Math.max(1, tMax - tMin)) * 64 - 4;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");

  // Donut
  const total = breakdown.reduce((a, b) => a + b.total, 0) || 1;
  let acc = 0;
  const stops = breakdown.map((b) => {
    const start = (acc / total) * 100;
    acc += b.total;
    const end = (acc / total) * 100;
    return `${b.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });
  const donutGradient = stops.length
    ? `conic-gradient(${stops.join(",")})`
    : "conic-gradient(#232329 0 100%)";
  const spent = summary.total;
  const donutCenter = spent >= 1000 ? `₹${(spent / 1000).toFixed(1)}k` : rupees(spent);

  // Category drift: top 5 categories, stacked per month, scaled to the busiest month
  const topCatIds = breakdown.slice(0, 5).map((b) => b.id);
  const monthTotals = overTime.series.map((row) =>
    topCatIds.reduce((a, id) => a + (row[id] ?? 0), 0)
  );
  const driftMax = Math.max(1, ...monthTotals);

  // vs cap
  let vsText = "no budget";
  let vsColor = "#86868f";
  if (summary.cap != null) {
    const diff = summary.cap - summary.total;
    vsText = diff >= 0 ? `${rupees(diff)} under` : `${rupees(-diff)} over`;
    vsColor = diff >= 0 ? "#34d39e" : "#f87171";
  }

  return (
    <div className="pt-[22px]">
      <div className="flex items-center justify-between">
        <span className="text-[21px] font-semibold tracking-[-0.01em]">Analytics</span>
        <span className="flex h-[34px] items-center rounded-[9px] border border-hairline px-[13px] text-[13px] text-muted">
          {monthLabel}
        </span>
      </div>

      {/* Weekly bars */}
      <Card className="mt-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium">
            {prevWeek ? "Previous week" : "This week"}
          </span>
          <button
            onClick={() => setPrevWeek((p) => !p)}
            className="text-xs text-accent"
          >
            {prevWeek ? "This week" : "Prev week"}
          </button>
        </div>
        <div className="mt-3.5 flex h-24 items-end justify-between gap-[9px]">
          {week.map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-[3px]"
              style={{
                height: `${Math.max(3, (d.total / wkMax) * 96)}px`,
                background: i === todayIdx ? "#34d39e" : "rgba(52,211,158,.28)",
              }}
            />
          ))}
        </div>
        <div className="mt-[7px] flex justify-between gap-[9px]">
          {DAY_LABELS.map((l, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[10px]"
              style={{ color: i === todayIdx ? "#34d39e" : "#55555d" }}
            >
              {l}
            </span>
          ))}
        </div>
      </Card>

      {/* 6-month trend */}
      <Card className="mt-3">
        <div className="text-[13px] font-medium">6-month trend</div>
        <svg
          viewBox="0 0 320 80"
          preserveAspectRatio="none"
          className="mt-2.5 block h-[72px] w-full"
        >
          <polyline
            points={trendPoints}
            fill="none"
            stroke="#34d39e"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="mt-1 flex justify-between">
          {trend.map((t, i) => (
            <span
              key={t.month}
              className="text-[10px]"
              style={{ color: i === trend.length - 1 ? "#86868f" : "#55555d" }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Donut + total */}
      <div className="mt-3 flex gap-3">
        <Card className="flex flex-[0_0_130px] items-center justify-center">
          <div
            className="relative h-[100px] w-[100px] rounded-full"
            style={{ background: donutGradient }}
          >
            <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-surface">
              <span className="tnum text-sm">{donutCenter}</span>
              <span className="text-[9px] text-faint">spent</span>
            </div>
          </div>
        </Card>
        <Card className="flex flex-1 flex-col justify-center gap-[10px]">
          <div>
            <div className="text-[11px] text-faint">This month</div>
            <div className="tnum mt-[3px] text-[22px] font-semibold tracking-[-0.01em]">
              {rupees(summary.total)}
            </div>
          </div>
          <div className="flex gap-[18px]">
            <div>
              <div className="text-[11px] text-faint">Entries</div>
              <div className="tnum mt-[2px] text-[15px]">{detail.reduce((a, c) => a + c.count, 0)}</div>
            </div>
            <div>
              <div className="text-[11px] text-faint">Categories</div>
              <div className="tnum mt-[2px] text-[15px]">{detail.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* By category: amounts, counts, and the notes you wrote */}
      <Card className="mt-3">
        <div className="text-[13px] font-medium">By category</div>
        <div className="mt-2.5 flex flex-col">
          {detail.map((c) => {
            const open = openCat === c.id;
            const pct = Math.round(c.share * 100);
            return (
              <div key={c.id} className="border-t border-white/[0.05] first:border-t-0">
                <button
                  onClick={() => setOpenCat(open ? null : c.id)}
                  className="flex w-full items-center gap-[9px] py-[11px] text-left"
                >
                  <span
                    className="h-[9px] w-[9px] shrink-0 rounded-sm"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm text-fg">{c.name}</span>
                  <span className="tnum text-[11px] text-faint">{c.count}</span>
                  <span className="ml-auto flex items-baseline gap-2.5">
                    <span className="tnum text-[11px] text-faint">{pct}%</span>
                    <span className="tnum text-[15px] text-fg">{rupees(c.total)}</span>
                  </span>
                  <span
                    className="ml-1 shrink-0 text-[10px] text-faint transition-transform"
                    style={{ transform: open ? "rotate(90deg)" : "none" }}
                    aria-hidden
                  >
                    ›
                  </span>
                </button>
                {/* Proportion bar in the category's own color */}
                <div className="mb-[11px] h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(2, c.share * 100)}%`, backgroundColor: c.color }}
                  />
                </div>
                {open && (
                  <div className="mb-[11px] flex flex-col gap-[7px] pl-[18px]">
                    {c.expenses.map((e) => (
                      <div key={e.id} className="flex items-baseline gap-3 text-xs">
                        <span className="min-w-0 flex-1 truncate text-muted">
                          {e.note || <span className="text-faint">No note</span>}
                        </span>
                        <span className="shrink-0 text-[10px] text-faint">{shortDate(e.spent_at)}</span>
                        <span className="tnum shrink-0 text-[13px] text-fg">{rupees(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {detail.length === 0 && (
            <span className="py-2 text-xs text-muted">
              No spending this month. Try logging something like 400 dinner.
            </span>
          )}
        </div>
      </Card>

      {/* Category drift */}
      <Card className="mt-3">
        <div className="text-[13px] font-medium">Category drift</div>
        <div className="mt-3.5 flex h-24 items-end justify-between gap-3.5">
          {overTime.months.map((m, mi) => (
            <div key={m.month} className="flex h-full flex-1 flex-col justify-end gap-0.5">
              {topCatIds.map((id) => {
                const v = overTime.series[mi][id] ?? 0;
                if (v <= 0) return null;
                return (
                  <div
                    key={id}
                    className="rounded-sm"
                    style={{
                      height: `${(v / driftMax) * 96}px`,
                      backgroundColor: byId[id]?.color ?? "#86868f",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-[7px] flex justify-between gap-3.5">
          {overTime.months.map((m) => (
            <span key={m.month} className="flex-1 text-center text-[10px] text-faint">
              {m.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Month summary */}
      <Card className="mt-3 grid grid-cols-2 gap-x-3.5 gap-y-[13px]">
        <Stat label="Total spent" value={rupees(summary.total)} mono />
        <Stat label="vs cap" value={vsText} color={vsColor} />
        <Stat
          label="Biggest category"
          value={
            summary.biggestCategory
              ? `${summary.biggestCategory.name} · ${rupees(summary.biggestCategory.total)}`
              : "—"
          }
        />
        <Stat
          label="Biggest expense"
          value={
            summary.biggestExpense
              ? `${summary.biggestExpense.note || byId[summary.biggestExpense.category_id]?.name || "Expense"} · ${rupees(summary.biggestExpense.amount)}`
              : "—"
          }
        />
        <Stat label="Zero-spend days" value={String(summary.zeroSpendDays)} mono />
      </Card>
    </div>
  );
}

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en", {
    day: "numeric",
    month: "short",
  });
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-hairline bg-surface p-[15px] ${className}`}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-faint">{label}</div>
      <div
        className={`mt-[3px] text-sm ${mono ? "tnum text-[15px]" : ""}`}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
