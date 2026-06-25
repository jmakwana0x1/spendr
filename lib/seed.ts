import type { Category } from "./types";

// Stable UUIDs so seed categories survive reloads, match across screens, and
// satisfy Postgres uuid columns / foreign keys when synced to Supabase.
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

export const OTHER_CATEGORY_ID = "00000000-0000-4000-8000-000000000009";

const SEED_KEYWORDS_BY_ID = new Map(
  SEED_CATEGORIES.map((c) => [c.id, c.keywords])
);

// Backfill keyword lists for built-in categories that came back with none.
// Stored/synced categories are authoritative and the seed lists are otherwise
// applied only once, so a category that ever landed with empty keywords (older
// build, manual insert, partial seed) would stay un-matchable forever. This
// self-heals those without touching user-edited keywords or custom categories.
export function healSeedKeywords(categories: Category[]): Category[] {
  let changed = false;
  const healed = categories.map((c) => {
    const seed = SEED_KEYWORDS_BY_ID.get(c.id);
    if (seed && seed.length && (!c.keywords || c.keywords.length === 0)) {
      changed = true;
      return { ...c, keywords: [...seed] };
    }
    return c;
  });
  return changed ? healed : categories;
}
