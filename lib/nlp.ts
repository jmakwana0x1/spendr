import type { Category, ParseResult } from "./types";
import { OTHER_CATEGORY_ID } from "./seed";

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

  // 2. Match remaining tokens against each category's keywords. First match wins.
  let matchedCategoryId: string | null = null;
  let matchedKeyword: string | null = null;

  outer: for (const token of tokens) {
    for (const cat of categories) {
      if (cat.is_archived) continue;
      if (cat.keywords.some((k) => k.toLowerCase() === token)) {
        matchedCategoryId = cat.id;
        matchedKeyword = token;
        break outer;
      }
    }
  }

  // 4. Whatever text is not the amount or matched keyword becomes the note.
  const noteTokens = tokens.filter((t) => t !== matchedKeyword);
  const note = noteTokens.length ? noteTokens.join(" ") : null;

  if (matchedCategoryId) {
    return { amount, categoryId: matchedCategoryId, note };
  }

  // 3. No keyword match: fall back to last-used (when only an amount was typed)
  // or "Other", and keep the full text as the note.
  if (tokens.length === 0 && lastUsedCategoryId) {
    return { amount, categoryId: lastUsedCategoryId, note: null };
  }

  return {
    amount,
    categoryId: lastUsedCategoryId ?? OTHER_CATEGORY_ID,
    note: note,
  };
}
