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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
              />
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
