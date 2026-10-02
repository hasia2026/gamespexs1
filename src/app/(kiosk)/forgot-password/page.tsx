"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * Forgot password (blueprint onboarding flow).
 * Sends a Supabase recovery email with a redirect back to /reset-password.
 * Note: the redirect URL must be allow-listed in Supabase Dashboard →
 * Authentication → URL Configuration for the link to land correctly.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-gsx-muted">
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="mt-6 rounded border border-gsx-accent/30 bg-gsx-accent/10 p-4">
          <p className="text-sm text-gsx-text">
            Check your inbox — a reset link is on its way to{" "}
            <span className="font-semibold">{email}</span>.
          </p>
          <p className="mt-2 text-xs text-gsx-muted">
            The link opens the reset-password page where you choose a new password.
          </p>
          <Link
            href="/login"
            className="mt-4 block text-center text-sm text-gsx-accent hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
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
          {error && <p className="text-xs text-gsx-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className="w-full rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <div className="flex items-center justify-between text-xs">
            <Link href="/login" className="text-gsx-muted hover:text-gsx-text">
              ← Back to sign in
            </Link>
            <Link href="/join" className="text-gsx-accent hover:underline">
              Create account
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
