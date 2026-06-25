import type { Category, ParseResult } from "./types";
import { findOtherCategoryId } from "./seed";

// Pure client-side parser. Input string -> { amount, categoryId, note }.
// No API. See claude.md "Local NLP parser".
export function parseInput(
  raw: string,
  categories: Category[],
  lastUsedCategoryId?: string | null
): ParseResult {
  const input = raw.trim();
  if (!input) return { amount: null, categoryId: null, note: null };

  // 1. Extract first number as amount. Strip currency symbols and commas first.
  const cleaned = input.replace(/[₹$€£,]/g, "");
  const amountMatch = cleaned.match(/\d+(\.\d{1,2})?/);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : null;

  // Remove the matched amount from the string to find the remaining tokens.
  let rest = cleaned;
  if (amountMatch) {
    rest = cleaned.replace(amountMatch[0], " ");
  }

  const tokens = rest
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  // Categories we can route to. Other is the fallback, never a positive match.
  const otherId = findOtherCategoryId(categories);
  const active = categories.filter(
    (c) => !c.is_archived && c.id !== otherId
  );

  let matchedCategoryId: string | null = null;
  const matchedTokens = new Set<string>();

  // 2. Match the input against each category by keywords AND by name. A category
  // named "Loan" or "Milk Bill" should match without the user hand-entering
  // keywords, so the category name is treated as an implicit keyword set.
  //
  // Pass A: full-name phrase match (e.g. "milk bill"). Most specific wins, so
  // categories with longer names are tried first.
  const byNameSpecificity = [...active].sort(
    (a, b) => nameTokens(b).length - nameTokens(a).length
  );
  for (const cat of byNameSpecificity) {
    const nt = nameTokens(cat);
    if (nt.length >= 2 && containsRun(tokens, nt)) {
      matchedCategoryId = cat.id;
      nt.forEach((t) => matchedTokens.add(t));
      break;
    }
  }

  // Pass B: single-token match against keywords or name words. The first input
  // token to match anything wins, mirroring left-to-right reading order.
  if (!matchedCategoryId) {
    outer: for (const token of tokens) {
      for (const cat of active) {
        if (matchesToken(cat, token)) {
          matchedCategoryId = cat.id;
          matchedTokens.add(token);
          break outer;
        }
      }
    }
  }

  // 3. Whatever text is not the amount or a matched word becomes the note.
  const noteTokens = tokens.filter((t) => !matchedTokens.has(t));
  const note = noteTokens.length ? noteTokens.join(" ") : null;

  if (matchedCategoryId) {
    return { amount, categoryId: matchedCategoryId, note };
  }

  // 4. No match: fall back to last-used (when only an amount was typed) or
  // "Other", and keep the full text as the note.
  if (tokens.length === 0 && lastUsedCategoryId) {
    return { amount, categoryId: lastUsedCategoryId, note: null };
  }

  return {
    amount,
    categoryId: lastUsedCategoryId ?? otherId,
    note: note,
  };
}

// The category name split into normalized word tokens, e.g. "Milk Bill" ->
// ["milk", "bill"]. Used so the name itself acts as a set of keywords.
function nameTokens(cat: Category): string[] {
  return cat.name
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

// True if `cat` should match a single input token, by explicit keyword or by
// any word in its name.
function matchesToken(cat: Category, token: string): boolean {
  if (cat.keywords.some((k) => k.toLowerCase() === token)) return true;
  return nameTokens(cat).includes(token);
}

// True if `needle` appears as a contiguous run inside `haystack`, e.g.
// ["milk","bill"] inside ["300","milk","bill"].
function containsRun(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}
