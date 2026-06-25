import type { Category } from "./types";
import { uid } from "./format";

// The default category set, as a template. The ids below are used ONLY as the
// offline / pre-sign-in local default (single browser, so a fixed id is safe
// and keeps SSR hydration stable). They are NOT written to Supabase as-is:
// every user gets their OWN freshly generated ids via `freshSeedCategories()`
// at seed time. Reusing one global id across users would make it un-writable
// by everyone but the first owner (the table's primary key is global, and RLS
// blocks writing a row you don't own) — the bug that broke multi-user.
// Muted hues, not neon, so a screen full of chips does not vibrate.
export const SEED_CATEGORIES: Category[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Light Bill",
    color: "#E0A458",
    keywords: ["light", "electricity", "power", "bill"],
    icon: "Lightbulb",
    sort_order: 0,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "WiFi",
    color: "#5B9BD5",
    keywords: ["wifi", "internet", "broadband", "router"],
    icon: "Wifi",
    sort_order: 1,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Eating Out",
    color: "#D17B7B",
    keywords: ["dinner", "lunch", "food", "restaurant", "cafe", "coffee", "snack"],
    icon: "UtensilsCrossed",
    sort_order: 2,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Groceries",
    color: "#6FB58A",
    keywords: ["groceries", "grocery", "dmart", "vegetables", "milk", "supermarket"],
    icon: "ShoppingCart",
    sort_order: 3,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Transport",
    color: "#9B8BD5",
    keywords: ["transport", "uber", "ola", "petrol", "fuel", "bus", "train", "metro", "auto", "cab"],
    icon: "Car",
    sort_order: 4,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Rent",
    color: "#C28FB0",
    keywords: ["rent", "house", "flat"],
    icon: "Home",
    sort_order: 5,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    name: "Shopping",
    color: "#D5A45B",
    keywords: ["shopping", "clothes", "amazon", "flipkart", "shoes"],
    icon: "ShoppingBag",
    sort_order: 6,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    name: "Health",
    color: "#6BC2B5",
    keywords: ["health", "medicine", "pharmacy", "doctor", "gym", "medical"],
    icon: "HeartPulse",
    sort_order: 7,
    is_archived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000009",
    name: "Other",
    color: "#8B8F99",
    keywords: [],
    icon: "Ellipsis",
    sort_order: 8,
    is_archived: false,
  },
];

// The fallback bucket the NLP parser routes to when nothing else matches.
// Identified by name (not a fixed id) so it works regardless of which per-user
// id the category was seeded with.
export const OTHER_CATEGORY_NAME = "Other";

export function isOtherCategory(c: Category): boolean {
  return c.name.trim().toLowerCase() === OTHER_CATEGORY_NAME.toLowerCase();
}

export function findOtherCategoryId(categories: Category[]): string | null {
  return categories.find(isOtherCategory)?.id ?? null;
}

// A fresh copy of the default categories with NEW per-user ids. Use this for
// every server-side seed (new account, reset) so two users never share an id.
export function freshSeedCategories(): Category[] {
  return SEED_CATEGORIES.map((c) => ({ ...c, id: uid() }));
}

const SEED_KEYWORDS_BY_NAME = new Map(
  SEED_CATEGORIES.map((c) => [c.name.toLowerCase(), c.keywords])
);

// Backfill keyword lists for built-in categories that came back with none.
// Matched by name (per-user ids vary), so a default category that ever landed
// with empty keywords (older build, manual insert, partial seed) gets its
// matching words back without touching user-edited keywords or custom
// categories.
export function healSeedKeywords(categories: Category[]): Category[] {
  let changed = false;
  const healed = categories.map((c) => {
    const seed = SEED_KEYWORDS_BY_NAME.get(c.name.toLowerCase());
    if (seed && seed.length && (!c.keywords || c.keywords.length === 0)) {
      changed = true;
      return { ...c, keywords: [...seed] };
    }
    return c;
  });
  return changed ? healed : categories;
}
