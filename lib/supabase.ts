import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase is optional. When env vars are absent the app runs fully local
// against localStorage (the v1 data layer). This lets dev work happen with
// zero cloud setup, per claude.md.
export const supabaseEnabled = Boolean(url && anon);

export function getSupabaseBrowser() {
  if (!supabaseEnabled) return null;
  return createBrowserClient(url as string, anon as string);
}
