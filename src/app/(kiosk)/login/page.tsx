"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "@/lib/config";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-sm text-gsx-muted">Loading sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    const requestedNext = searchParams.get("next") ?? "/";
    const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
    router.replace(safeNext);
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-gsx-muted">GAMESPEXS Command Center access.</p>

      {isDemoMode ? (
        <div className="mt-6 rounded border border-gsx-accent/30 bg-gsx-accent/10 p-4">
          <p className="text-sm text-gsx-text">You are running the local demo. No account is needed.</p>
          <Link href="/" className="mt-4 block rounded bg-gsx-accent px-4 py-2 text-center text-sm font-semibold text-[#0f1210]">
            Open demo dashboard
          </Link>
        </div>
      ) : (
        <>
          {!isSupabaseConfigured && (
            <div className="mt-6 rounded border border-gsx-warn/30 bg-gsx-warn/10 p-3 text-xs text-gsx-warn">
              Supabase auth is not configured yet. Add credentials to{" "}
              <code className="font-mono">.env.local</code> to enable sign-in.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gsx-muted" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gsx-muted" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 pr-10 text-sm outline-none focus:border-gsx-accent/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gsx-muted hover:text-gsx-text"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-gsx-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="w-full rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-gsx-muted hover:text-gsx-text">
              Forgot password?
            </Link>
            <Link href="/join" className="text-gsx-accent hover:underline">
              Create account →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
