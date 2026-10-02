// ============================================================================
// Brand mention detection — powers the automatic sponsor tally system.
// Scans free-form text (survey answers, session notes, event logs) for
// sponsor brand names and returns every sponsor mentioned at least once.
// Dependency-free and deterministic so server actions can call it anywhere.
// ============================================================================

import type { Sponsor } from "./types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns the distinct sponsors whose brand name appears in `text`
 * (case-insensitive, whole-phrase match).
 */
export function detectMentions(text: string, sponsors: Sponsor[]): Sponsor[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const found: Sponsor[] = [];
  for (const sponsor of sponsors) {
    const name = sponsor.name.trim().toLowerCase();
    if (name.length < 3) continue; // ignore trivially short names
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(name)}([^a-z0-9]|$)`, "i");
    if (re.test(haystack)) found.push(sponsor);
  }
  return found;
}
