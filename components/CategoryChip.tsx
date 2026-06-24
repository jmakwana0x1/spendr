"use client";

import type { Category } from "@/lib/types";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

// Pill chip: category color at low opacity as fill, full color as text/border
// when active. Min 44px tap target.
export function CategoryChip({
  category,
  active,
  onClick,
}: {
  category: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-tap shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "" : "text-muted"
      )}
      style={{
        backgroundColor: active ? hexA(category.color, 0.18) : hexA(category.color, 0.08),
        borderColor: active ? category.color : "transparent",
        color: active ? category.color : undefined,
      }}
    >
      <Icon name={category.icon} size={16} />
      <span className="whitespace-nowrap">{category.name}</span>
    </button>
  );
}

// Hex with alpha. Accepts #RGB or #RRGGBB.
export function hexA(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
