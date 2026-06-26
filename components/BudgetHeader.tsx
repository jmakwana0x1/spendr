"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import { formatMoney } from "@/lib/format";
import type { BudgetStatus } from "@/lib/selectors";

// The remaining number is the one moment of drama: large, tabular Geist Mono,
// neutral to red as it crosses zero. Burn rate and cap progress sit beneath.
export function BudgetHeader({ status, month }: { status: BudgetStatus; month: string }) {
  const over = status.remaining < 0;
  const monthLabel = new Date(month + "T00:00:00").toLocaleString("en", {
    month: "long",
  });
  const capPct = status.cap > 0 ? Math.min(100, (status.spent / status.cap) * 100) : 0;
  const overCap = capPct >= 100;

  return (
    <div className="sticky top-0 z-[5] -mx-[18px] mb-0 border-b border-white/[0.07] bg-bg/[0.86] px-[18px] pb-[15px] pt-[22px] backdrop-blur-md">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
          Remaining this month
        </span>
        <span className="text-xs text-faint">{monthLabel}</span>
      </div>
      <p
        className="tnum mt-1.5 text-[44px] font-semibold leading-none tracking-[-0.02em]"
        style={{ color: over ? "#f87171" : "#f4f4f5" }}
      >
        {over && "-"}₹
        <AnimatedNumber
          value={Math.abs(status.remaining)}
          format={(n) => formatMoney(Math.round(n))}
        />
      </p>
      <div className="mt-[9px] flex items-center justify-between">
        <span className="tnum text-[13px] text-muted">
          ₹{formatMoney(Math.round(status.perDay))}/day for {status.daysLeft} days
        </span>
        <span className="tnum text-xs text-faint">
          {formatMoney(status.spent)} / {formatMoney(status.cap)}
        </span>
      </div>
      <div className="mt-[11px] h-1 overflow-hidden rounded bg-white/[0.08]">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${capPct}%`, backgroundColor: overCap ? "#f87171" : "#34d39e" }}
        />
      </div>
    </div>
  );
}
