"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Plus, Target, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Add", icon: Plus },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-col items-stretch justify-around">
        {items.map(({ href, label, icon: I }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
                active ? "text-accent" : "text-muted"
              )}
            >
              <I size={20} strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
