/**
 * Shared runtime configuration for GAMESPEXS.
 * Local demo mode uses in-repo seed data. Live and production modes require
 * Supabase credentials and never silently fall back to demo records.
 */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const demoOverride =
  process.env.GAMESPEXS_DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_GAMESPEXS_DEMO_MODE === "true";

/** Demo is permitted in development when explicitly selected or offline. */
export const isDemoMode =
  process.env.NODE_ENV !== "production" &&
  (demoOverride || !isSupabaseConfigured);

export const isLiveMode = !isDemoMode;

export type AppRole =
  | "admin"
  | "executive"
  | "researcher"
  | "field_operator"
  | "judge"
  | "storefront"
  | "sponsor_manager"
  | "viewer"
  | "interviewer"
  | "sponsor";

export const APP_NAME = "GAMESPEXS";
export const APP_TAGLINE = "Game Research & Operations Platform";
