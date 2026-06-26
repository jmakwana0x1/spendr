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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-9 text-center">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent font-mono text-xl font-bold text-accent-ink">
          S
        </span>
        <span className="text-2xl font-semibold tracking-tight">Spendr</span>
      </div>
      <p className="mt-3.5 text-sm text-muted">Log money in three seconds.</p>

      {enabled ? (
        <>
          <button
            onClick={signInWithGoogle}
            className="mt-8 flex h-[50px] w-full max-w-xs items-center justify-center gap-2.5 rounded-xl bg-fg px-6 font-semibold text-bg"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            Single account. Your data stays yours.
            <br />
            Works offline once signed in.
          </p>
        </>
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
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
