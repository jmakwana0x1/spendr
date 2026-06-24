"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import { formatMoney } from "@/lib/format";
import type { BudgetStatus } from "@/lib/selectors";
import { cn } from "@/lib/cn";

// The remaining number is the one moment of drama: large, tabular, color
// shifts neutral to red as it crosses zero. Burn rate sits quietly beneath.
export function BudgetHeader({ status, month }: { status: BudgetStatus; month: string }) {
  const over = status.over;
  const monthLabel = new Date(month + "T00:00:00").toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-hairline bg-bg/95 px-4 pb-3 pt-1 backdrop-blur">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted">
            {over ? "Over budget" : "Remaining"} · {monthLabel}
          </p>
          <p
            className={cn(
              "tnum text-hero font-semibold leading-none",
              over ? "text-over" : "text-fg"
            )}
          >
            <span className="text-lg align-top">₹</span>
            <AnimatedNumber
              value={Math.abs(status.remaining)}
              format={(n) => formatMoney(Math.round(n))}
            />
          </p>
        </div>
        <div className="pb-1 text-right">
          {status.daysLeft > 0 && !over && (
            <p className="tnum text-sm text-muted">
              ₹{formatMoney(Math.round(status.perDay))}/day
            </p>
          )}
          <p className="tnum text-xs text-muted">
            {status.daysLeft > 0 ? `for ${status.daysLeft} days` : "month ended"}
          </p>
        </div>
      </div>
    </div>
  );
}
