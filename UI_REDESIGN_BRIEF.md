# Spendr UI Redesign Brief

A handoff document for a UI redesign. Goal: keep every existing screen and
feature, but give the app a **fresh visual direction** (new color, typography,
layout feel, motion). Do not change data model, routes, or behavior.

---

## 1. What Spendr is

A single-user PWA expense tracker. You open it ten times a day to log money
fast. Not a dashboard you admire, a tool you use. Mobile-first, dark, dense.

Core promise: logging an expense takes under 3 seconds and never more than 2
taps for a recurring category. The redesign must not slow that down.

Stack (do not change): Next.js 14 App Router, TypeScript, Tailwind,
Framer Motion (micro-interactions only), Recharts, Supabase, lucide-react icons,
Inter font. Currency is Indian Rupees (₹).

---

## 2. Current architecture (keep all of this)

Layout: a single centered mobile column, `max-w-col` (440px), centered on
desktop. Fixed bottom nav with 4 tabs. Content lives in `app/`:

| Route          | Screen     | Bottom nav label |
| -------------- | ---------- | ---------------- |
| `/`            | Home / Quick-add | Add        |
| `/analytics`   | Analytics  | Analytics        |
| `/budget`      | Budget     | Budget           |
| `/settings`    | Settings   | Settings         |
| `/login`       | Sign in (Continue with Google) | n/a |

Key components: `BudgetHeader`, `CategoryChip`, `ExpenseRow`,
`EditExpenseSheet`, `Toast`, `AnimatedNumber`, `BottomNav`, `Icon`.

Design tokens live in `tailwind.config.ts` (colors, type scale, spacing) and
`app/globals.css` (tabular-nums `.tnum`, no-scrollbar rail). **Redesign by
editing these tokens and component classes, not by rewriting logic.**

---

## 3. The five screens, feature by feature

### Home / Quick-add (`app/page.tsx`) — the most important screen

- **Sticky budget header** (only if a budget is set this month): big "remaining"
  number that counts down when you log, plus a quiet burn-rate line
  ("683/day for 12 days"). Number color-shifts neutral to red when negative.
- **Template suggestion chips**: one-tap log chips for recurring templates due
  within 3 days (e.g. "Rent · ₹15,000").
- **Quick-add card** (the visual anchor, slightly elevated):
  - NLP text input ("400 dinner") with a live **parse-preview line** showing
    detected amount / category / note before confirm.
  - Manual amount field with ₹ prefix and an Add button.
  - Horizontal scrolling **category chips**, ordered by most-frequent-this-week,
    one always active.
  - Collapsible "+ Add note" field.
- **Recent list**: last 30 expenses. Each row is editable (opens a bottom sheet)
  and deletable with an Undo toast. New rows animate in.

### Analytics (`app/analytics/page.tsx`)

- Weekly bar chart: spend per day, current week with prev-week toggle.
- Monthly trend line across last 6 months.
- Category breakdown donut for the selected month.
- Category-over-time stacked bar across months (drift).
- Month-end summary card: total, vs cap, biggest category, biggest single
  expense, zero-spend day count.

### Budget (`app/budget/page.tsx`)

- Toggle monthly budget on/off.
- Set total cap.
- Optional per-category caps with progress bars.

### Settings (`app/settings/page.tsx`)

- Manage categories (name, color, icon, keywords for the NLP parser).
- Manage recurring templates (label, amount, category, default day).
- CSV export, date-range filterable.

### Login (`app/login/page.tsx`)

- One "Continue with Google" button. Nothing else.

---

## 4. Fresh visual direction — creative latitude

You may rethink color, type, surfaces, radius, density, and motion. Treat the
old system as the baseline to improve on, not a constraint. Suggested moves
(pick a coherent set, do not do all):

- **Color**: stay dark-first (you log at night), but you may choose a new base
  hue and a new single accent. Could go warmer charcoal, deep navy, or a true
  near-black with a more vivid accent. One accent only. Category colors stay
  free but muted.
- **Typography**: Inter is fine, or propose Geist. Keep tabular numbers for all
  money (non-negotiable). Amounts are the loudest thing on screen.
- **Surfaces**: experiment with elevation, hairlines vs soft shadows, corner
  radius, and whether the quick-add card floats more.
- **Density**: keep it dense and scannable. This is the opposite of a spacious
  marketing site.
- **Charts**: strip chartjunk. No gridlines unless needed, no shadows, no 3D.
  Data is the only ink. Category colors or the single accent.
- **Motion**: the count-down on the remaining number when you log is the reward
  loop. Make it feel great. Everything else 150-200ms ease or nothing.

---

## 5. Hard rules (do not break, even in a fresh direction)

- Mobile-first single column, ~440px, centered on desktop. Do not stretch the
  logging UI across a wide screen.
- Min 44px tap targets in lists and chips.
- Tabular numbers everywhere money appears, right-aligned. Labels left.
- One accent color only. Red means "over budget," never decorative.
- No em-dashes in any UI copy, label, empty state, or comment.
- No emojis in the UI.
- Empty states: one plain sentence plus a sample input hint, no illustration.
- Do not center body text.
- Keep all routes, data flow, and the offline-first store behavior intact.

---

## 6. How to work

1. Run the app first (`npm run dev`) and look at each screen as it is today.
2. Propose the new direction as token changes in `tailwind.config.ts` +
   `app/globals.css`, then apply across components screen by screen.
3. Keep `npm run typecheck` and `npm run build` green.
4. Show before/after of the Home screen first for sign-off before doing the
   rest, since Home is the screen that matters most.
