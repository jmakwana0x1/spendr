"use client";

import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { enabled, user, ready, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Already signed in (or local mode): send them to the app.
  useEffect(() => {
    if (ready && (user || !enabled)) router.replace("/");
  }, [ready, user, enabled, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-1 text-2xl font-semibold text-accent">S</div>
      <h1 className="text-xl font-semibold">Spendr</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Fast personal expense logging. Sign in to sync across your devices.
      </p>

      {enabled ? (
        <button
          onClick={signInWithGoogle}
          className="mt-8 flex h-tap items-center gap-2 rounded-xl bg-accent px-6 font-semibold text-bg"
        >
          <GoogleMark />
          Continue with Google
        </button>
      ) : (
        <p className="mt-8 max-w-xs rounded-xl border border-hairline bg-surface p-4 text-sm text-muted">
          Cloud sync is off. The app runs on this device only. Add your Supabase keys
          to .env.local to enable Google sign-in.
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#0F1115" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#0F1115" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.33A9 9 0 0 0 9 18Z" opacity=".7" />
      <path fill="#0F1115" d="M3.98 10.72A5.4 5.4 0 0 1 3.98 7.28V4.96H.92a9 9 0 0 0 0 8.09l3.06-2.33Z" opacity=".5" />
      <path fill="#0F1115" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .92 4.96l3.06 2.32C4.68 5.16 6.66 3.58 9 3.58Z" opacity=".85" />
    </svg>
  );
}
