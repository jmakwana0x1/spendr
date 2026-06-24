"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useStore } from "@/lib/store";
import {
  categoryBreakdown,
  categoryOverTime,
  monthSummary,
  monthlyTrend,
  spendPerDayOfWeek,
} from "@/lib/selectors";
import { monthStart, rupees } from "@/lib/format";

const AXIS = { fontSize: 11, fill: "#8B8F99" };

export default function AnalyticsPage() {
  const { ready, data } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const months = useMemo(() => {
    const out: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        label: d.toLocaleString("en", { month: "long", year: "numeric" }),
        value: monthStart(d),
      });
    }
    return out;
  }, []);
  const [month, setMonth] = useState(months[0].value);

  const week = useMemo(
    () => spendPerDayOfWeek(data.expenses, weekOffset),
    [data.expenses, weekOffset]
  );
  const trend = useMemo(() => monthlyTrend(data.expenses, 6), [data.expenses]);
  const breakdown = useMemo(() => categoryBreakdown(data, month), [data, month]);
  const overTime = useMemo(() => categoryOverTime(data, 6), [data]);
  const summary = useMemo(() => monthSummary(data, month), [data, month]);

  const overTimeData = overTime.months.map((m, i) => ({
    label: m.label,
    ...overTime.series[i],
  }));

  if (!ready) return <div className="py-20 text-center text-sm text-muted">Loading…</div>;

  const hasData = data.expenses.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-fg outline-none"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </header>

      {!hasData && (
        <p className="px-1 py-8 text-sm text-muted">
          Nothing to chart yet. Log a few expenses and your spending shows up here.
        </p>
      )}

      {/* Weekly bar */}
      <Card>
        <CardHead title="This week">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded px-2 py-1 text-muted hover:text-fg"
            >
              Prev
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="rounded px-2 py-1 text-muted hover:text-fg disabled:opacity-40"
            >
              This week
            </button>
          </div>
        </CardHead>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={week} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#1E2128" }}
              content={<MoneyTooltip />}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#34D399" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly trend */}
      <Card>
        <CardHead title="Last 6 months" />
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip content={<MoneyTooltip />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#34D399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#34D399" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Category donut */}
      <Card>
        <CardHead title="By category" />
        {breakdown.length === 0 ? (
          <p className="py-6 text-sm text-muted">No spending this month.</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {breakdown.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-1.5 text-sm">
              {breakdown.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="truncate text-muted">{d.name}</span>
                  </span>
                  <span className="tnum text-fg">{rupees(d.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Category over time, stacked */}
      <Card>
        <CardHead title="Category drift" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={overTimeData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#1E2128" }} content={<StackTooltip cats={overTime.categories} />} />
            {overTime.categories.map((c, i) => (
              <Bar
                key={c.id}
                dataKey={c.id}
                stackId="s"
                fill={c.color}
                radius={i === overTime.categories.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Month-end summary */}
      <Card>
        <CardHead title="Summary" />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Total spent" value={rupees(summary.total)} />
          <Stat
            label="vs budget"
            value={summary.cap == null ? "no budget" : rupees(summary.cap - summary.total)}
            over={summary.cap != null && summary.total > summary.cap}
          />
          <Stat
            label="Biggest category"
            value={
              summary.biggestCategory
                ? `${summary.biggestCategory.name}`
                : "—"
            }
            sub={summary.biggestCategory ? rupees(summary.biggestCategory.total) : undefined}
          />
          <Stat
            label="Biggest expense"
            value={summary.biggestExpense ? rupees(summary.biggestExpense.amount) : "—"}
            sub={summary.biggestExpense?.note ?? undefined}
          />
          <Stat label="Zero-spend days" value={String(summary.zeroSpendDays)} />
        </dl>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4">
      {children}
    </section>
  );
}

function CardHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-fg">{title}</h2>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  over,
}: {
  label: string;
  value: string;
  sub?: string;
  over?: boolean;
}) {
  return (
    <div className="rounded-xl bg-elevated p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tnum text-base font-semibold ${over ? "text-over" : "text-fg"}`}>
        {value}
      </dd>
      {sub && <dd className="truncate text-xs text-muted">{sub}</dd>}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-elevated px-3 py-2 text-xs shadow">
      {label && <p className="mb-0.5 text-muted">{label}</p>}
      <p className="tnum font-semibold text-fg">{rupees(payload[0].value)}</p>
    </div>
  );
}

function StackTooltip({ active, payload, label, cats }: any) {
  if (!active || !payload?.length) return null;
  const rows = payload
    .filter((p: any) => p.value > 0)
    .sort((a: any, b: any) => b.value - a.value);
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-elevated px-3 py-2 text-xs shadow">
      <p className="mb-1 text-muted">{label}</p>
      {rows.map((p: any) => {
        const cat = cats.find((c: any) => c.id === p.dataKey);
        return (
          <p key={p.dataKey} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
              {cat?.name}
            </span>
            <span className="tnum text-fg">{rupees(p.value)}</span>
          </p>
        );
      })}
    </div>
  );
}
