#!/usr/bin/env node
/**
 * GAMESPEXS staff provisioning — creates the 33-person depth chart
 * (Jun's revised org: Executive Core 3, Field Ops & Production 10,
 * Data/Compliance/Research 18, Administrative Core 2) as Supabase auth
 * users with correctly-role-gated profiles.
 *
 * Usage (from gamespexs/):
 *   SUPABASE_SERVICE_ROLE_KEY=<service key> node scripts/provision-staff.mjs
 *
 * Requires the SERVICE ROLE key (Admin API) — never commit it. Get it from
 * Supabase Dashboard → Project Settings → API. The publishable/anon key
 * cannot create users.
 *
 * Re-running is safe: existing users are updated (name/role), not duplicated.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.\n" +
      "Get the service key: Supabase Dashboard → Project Settings → API.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false } });

// Placeholder password — every account must change it at first login.
const INITIAL_PASSWORD = "Gsx!Onboard-2026";

/**
 * 33-person depth chart mapped to platform roles. Edit `name`/`email`
 * to real people before running against production.
 */
const ROSTER = [
  // ── EXECUTIVE CORE (3) ──────────────────────────────────────────────
  { name: "Ryn James — Principal Director & Legal Owner", email: "principal.director@gamespexs.com", role: "executive" },
  { name: "Jun — Founder & Operations Manager", email: "founder.ops@gamespexs.com", role: "executive" },
  { name: "On-Site Technology Coordinator", email: "tech.coordinator@gamespexs.com", role: "admin" },

  // ── FIELD OPS & PRODUCTION (10) ─────────────────────────────────────
  { name: "On-Site Game Judge 1", email: "judge.1@gamespexs.com", role: "judge" },
  { name: "On-Site Game Judge 2", email: "judge.2@gamespexs.com", role: "judge" },
  { name: "On-Site Game Judge 3", email: "judge.3@gamespexs.com", role: "judge" },
  { name: "On-Site Game Judge 4", email: "judge.4@gamespexs.com", role: "judge" },
  { name: "On-Site DJ / Shift Emcee 1", email: "dj.1@gamespexs.com", role: "field_operator" },
  { name: "On-Site DJ / Shift Emcee 2", email: "dj.2@gamespexs.com", role: "field_operator" },
  { name: "Camera/Overhead Rig Operator 1", email: "camera.1@gamespexs.com", role: "field_operator" },
  { name: "Camera/Overhead Rig Operator 2", email: "camera.2@gamespexs.com", role: "field_operator" },
  { name: "Media Editor 1", email: "media.editor1@gamespexs.com", role: "storefront" },
  { name: "Media Editor 2", email: "media.editor2@gamespexs.com", role: "storefront" },

  // ── DATA / COMPLIANCE / RESEARCH (18) ───────────────────────────────
  { name: "Board Game Expert", email: "board.expert@gamespexs.com", role: "researcher" },
  { name: "Video Game Expert", email: "video.expert@gamespexs.com", role: "researcher" },
  { name: "Journalist", email: "journalist@gamespexs.com", role: "storefront" },
  { name: "Game Author", email: "game.author@gamespexs.com", role: "researcher" },
  { name: "Remote Market Research Interviewer Captain 1", email: "interviewer.captain1@gamespexs.com", role: "interviewer" },
  { name: "Remote Market Research Interviewer Captain 2", email: "interviewer.captain2@gamespexs.com", role: "interviewer" },
  { name: "Remote Market Research Interviewer Captain 3", email: "interviewer.captain3@gamespexs.com", role: "interviewer" },
  { name: "Remote Market Research Interviewer Captain 4", email: "interviewer.captain4@gamespexs.com", role: "interviewer" },
  { name: "Verification Specialist 1", email: "verification.1@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 2", email: "verification.2@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 3", email: "verification.3@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 4", email: "verification.4@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 5", email: "verification.5@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 6", email: "verification.6@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 7", email: "verification.7@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 8", email: "verification.8@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 9", email: "verification.9@gamespexs.com", role: "viewer" },
  { name: "Verification Specialist 10", email: "verification.10@gamespexs.com", role: "viewer" },

  // ── ADMINISTRATIVE CORE (2) ─────────────────────────────────────────
  { name: "In-House Payroll Specialist", email: "payroll@gamespexs.com", role: "executive" },
  { name: "Short-Term Graphic Designer (contract)", email: "graphic.designer@gamespexs.com", role: "storefront" },
];

let created = 0;
let updated = 0;
let failed = 0;

for (const person of ROSTER) {
  // 1. Create (or fetch) the auth user via the Admin API.
  const { data: created_user, error: createErr } = await admin.auth.admin.createUser({
    email: person.email,
    password: INITIAL_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: person.name },
  });

  let userId = created_user?.user?.id;

  if (createErr) {
    if (createErr.message?.includes("already")) {
      const { data: listed } = await admin.auth.admin.listUsers();
      userId = listed?.users?.find((u) => u.email === person.email)?.id;
    }
    if (!userId) {
      console.error(`✗ ${person.email}: ${createErr.message}`);
      failed += 1;
      continue;
    }
    updated += 1;
  } else {
    created += 1;
  }

  // 2. Upsert the profile row (role gating lives here).
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert(
      { id: userId, email: person.email, full_name: person.name, role: person.role, is_active: true },
      { onConflict: "id" },
    );

  if (profileErr) {
    console.error(`✗ profile for ${person.email}: ${profileErr.message}`);
    failed += 1;
    continue;
  }

  console.log(`✓ ${person.email} → ${person.role}`);
}

console.log(`\nDone. ${created} created, ${updated} existing, ${failed} failed. (${ROSTER.length} in chart)`);
console.log(`Initial password: ${INITIAL_PASSWORD} — accounts must change it at first login.`);
