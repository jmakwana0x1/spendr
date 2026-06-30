// Money formatting. Single currency, no decimals unless present.
const nf = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const nf2 = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatMoney(n: number): string {
  return nf.format(n);
}

export function formatMoney2(n: number): string {
  return nf2.format(n);
}

// "₹" prefix kept separate so callers can style the symbol smaller if wanted.
export function rupees(n: number): string {
  return "₹" + formatMoney(n);
}

// Returns YYYY-MM-DD in the user's local timezone, not UTC.
// new Date().toISOString() is always UTC and will return the wrong date for
// users east of UTC (e.g. IST UTC+5:30) during the first ~5.5 hours of the day.
export function localDateISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(): string {
  return localDateISO();
}

export function monthStart(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
