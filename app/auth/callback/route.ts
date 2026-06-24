import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

// Uses cookies + OAuth exchange, so never statically collected.
export const dynamic = "force-dynamic";

// OAuth callback: exchange the code for a session, then land on home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = getSupabaseServer();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/`);
}
