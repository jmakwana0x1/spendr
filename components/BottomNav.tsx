"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Plus, SlidersHorizontal, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Add", icon: Plus },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-col border-t border-white/[0.07] bg-bg/[0.92] pb-[13px] pt-[9px] backdrop-blur-md">
      {items.map(({ href, label, icon: I }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1",
              active ? "text-accent" : "text-[#5a5a62]"
            )}
          >
            <I size={21} strokeWidth={2.1} />
            <span className="text-[10px] tracking-[0.02em]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
