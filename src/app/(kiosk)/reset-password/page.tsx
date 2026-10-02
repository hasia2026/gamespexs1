"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Reset password — the landing page for Supabase recovery links.
 * The browser client exchanges the `code` query param for a session
 * automatically (detectSessionInUrl), then the member sets a new password.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-sm text-gsx-muted">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Supabase recovery links arrive as ?code=... (PKCE exchange) — surface
  // a clear message if the link is missing, expired, or already used.
  const code = searchParams.get("code");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
    setTimeout(() => {
      router.replace("/member");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="mx-auto max-w-sm py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-gsx-muted">
        Choose a new password for your GAMESPEXS account.
      </p>

      {!code && !done ? (
        <div className="mt-6 rounded border border-gsx-danger/30 bg-gsx-danger/10 p-4 text-sm">
          <p className="text-gsx-text">This reset link is missing or invalid.</p>
          <p className="mt-2 text-xs text-gsx-muted">
            Request a fresh link below — links expire quickly for security.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 block text-center text-sm text-gsx-accent hover:underline"
          >
            Send a new reset link
          </Link>
        </div>
      ) : done ? (
        <div className="mt-6 rounded border border-gsx-accent/30 bg-gsx-accent/10 p-4">
          <p className="text-sm text-gsx-text">Password updated — signing you in…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gsx-muted" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gsx-muted" htmlFor="confirm">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
            />
          </div>
          {error && <p className="text-xs text-gsx-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
