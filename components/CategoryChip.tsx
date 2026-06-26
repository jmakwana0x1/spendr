"use client";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";

// Obsidian chip: square color dot + name, 36px tall. Active = accent fill,
// border and text. Inactive = elevated fill, hairline border, muted text.
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
        "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3 text-sm transition-colors",
        active
          ? "border-accent bg-accent/[0.14] text-accent"
          : "border-hairline bg-elevated text-muted"
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-sm"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      {category.name}
    </button>
  );
}

// Hex with alpha. Accepts #RGB or #RRGGBB. Kept for callers that tint by color.
export function hexA(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
