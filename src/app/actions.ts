"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/data";
import type { AppRole } from "@/lib/config";
import { requireAnyRole } from "@/lib/roles";

export type ActionState = { ok: boolean; message: string };

async function sb(allowedRoles: AppRole[] = ["admin"]) {
  if (DEMO_MODE) return { client: null, error: null };
  try {
    await requireAnyRole(allowedRoles);
  } catch (error) {
    return {
      client: null,
      error: error instanceof Error ? error.message : "Your account cannot perform this action.",
    };
  }
  const client = await createClient();
  return client
    ? { client, error: null }
    : { client: null, error: "Live database is unavailable." };
}

function fail(error: { message: string } | null): ActionState | null {
  if (error) return { ok: false, message: error.message };
  return null;
}

// ------------------------------------------------------------------- games
export async function createGame(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  const title = String(formData.get("title") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "");
  if (!title || !category_id) return { ok: false, message: "Title and category are required." };

  if (!supabase) return { ok: true, message: `Demo mode: "${title}" would be saved to the games table.` };

  const { error } = await supabase.from("games").insert({
    title,
    category_id,
    publisher: str(formData, "publisher"),
    year_released: num(formData, "year_released"),
    min_players: num(formData, "min_players") ?? 1,
    max_players: num(formData, "max_players") ?? 4,
    play_minutes: num(formData, "play_minutes"),
    complexity: str(formData, "complexity") || "medium",
    is_closed_network: formData.get("is_closed_network") === "on",
    description: str(formData, "description"),
  });
  if (fail(error)) return fail(error)!;
  revalidatePath("/games");
  return { ok: true, message: `Game "${title}" created.` };
}

export async function updateGame(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing game id." };

  if (!supabase) return { ok: true, message: "Demo mode: changes would be saved to the games table." };

  const { error } = await supabase
    .from("games")
    .update({
      title: str(formData, "title"),
      publisher: str(formData, "publisher"),
      play_minutes: num(formData, "play_minutes"),
      complexity: str(formData, "complexity") || "medium",
      is_closed_network: formData.get("is_closed_network") === "on",
      description: str(formData, "description"),
    })
    .eq("id", id);
  if (fail(error)) return fail(error)!;
  revalidatePath("/games");
  return { ok: true, message: "Game updated." };
}

export async function deleteGame(formData: FormData): Promise<void> {
  const { client: supabase, error: authorizationError } = await sb(["admin"]);
  if (authorizationError) return;
  const id = String(formData.get("id") ?? "");
  if (!supabase || !id) return;
  await supabase.from("games").delete().eq("id", id);
  revalidatePath("/games");
}

// ----------------------------------------------------------------- studies
export async function createStudy(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "Title is required." };
  const code = String(formData.get("code") ?? "").trim() ||
    `GSX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  if (!supabase) return { ok: true, message: `Demo mode: study "${code}" would be created.` };

  const { error } = await supabase.from("studies").insert({
    code,
    title,
    research_question: str(formData, "research_question"),
    status: str(formData, "status") || "draft",
    starts_on: str(formData, "starts_on") || null,
    ends_on: str(formData, "ends_on") || null,
  });
  if (fail(error)) return fail(error)!;
  revalidatePath("/research/studies");
  return { ok: true, message: `Study ${code} created.` };
}

export async function updateStudyStatus(formData: FormData): Promise<void> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher"]);
  if (authorizationError) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!supabase || !id || !status) return;
  await supabase.from("studies").update({ status }).eq("id", id);
  revalidatePath("/research/studies");
}

// ------------------------------------------------------------ participants
export async function createParticipant(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { ok: false, message: "Participant code is required." };

  if (!supabase) return { ok: true, message: `Demo mode: participant ${code} would be created.` };

  const consent = formData.get("consent_given") === "on";
  const { error } = await supabase.from("participants").insert({
    code,
    display_name: str(formData, "display_name"),
    birth_year: num(formData, "birth_year"),
    gender: str(formData, "gender"),
    city: str(formData, "city"),
    county: str(formData, "county"),
    state: str(formData, "state"),
    consent_given: consent,
    consent_at: null,
  });
  if (fail(error)) return fail(error)!;
  revalidatePath("/research/participants");
  return { ok: true, message: `Participant ${code} created.` };
}

// ---------------------------------------------------------------- sessions
export async function createSession(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher", "field_operator", "interviewer"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  const study_id = String(formData.get("study_id") ?? "");
  const participant_id = String(formData.get("participant_id") ?? "");
  const game_id = String(formData.get("game_id") ?? "");
  if (!study_id || !participant_id || !game_id) {
    return { ok: false, message: "Study, participant, and game are required." };
  }

  if (!supabase) return { ok: true, message: "Demo mode: session would be scheduled." };

  const { error } = await supabase.from("research_sessions").insert({
    study_id,
    participant_id,
    game_id,
    location_id: str(formData, "location_id") || null,
    duration_minutes: num(formData, "duration_minutes"),
    channel: str(formData, "channel") || "storefront",
    status: "scheduled",
    notes: str(formData, "notes"),
  });
  if (fail(error)) return fail(error)!;
  revalidatePath("/research/sessions");
  return { ok: true, message: "Session scheduled." };
}

// ------------------------------------------------------------- survey runner
/** Kiosk submission: writes every answered question to survey_responses
 *  and auto-tallies sponsor brand mentions found in free-text answers. */
export async function submitSurveyRun(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = String(formData.get("session_id") ?? "");
  const surveyId = String(formData.get("survey_id") ?? "");
  if (!sessionId || !surveyId) return { ok: false, message: "Missing session or survey." };

  const answers: Array<{ key: string; value: string }> = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q_") && typeof value === "string" && value.trim() !== "") {
      answers.push({ key, value: value.trim() });
    }
  }
  if (answers.length === 0) return { ok: false, message: "No answers were recorded." };
  if (!isUuid(sessionId) || !isUuid(surveyId)) {
    return { ok: false, message: "Invalid session or survey reference." };
  }

  // Kiosk flow: participants are unauthenticated, so this writes through the
  // security-definer RPC (the only anon-writable path into survey_responses).
  const supabase = await createClient();
  if (!supabase) {
    return { ok: true, message: `Demo mode: ${answers.length} response(s) recorded for this session.` };
  }

  const payload = answers.map(({ key, value }) => ({
    question_id: key.slice(2),
    value: value === "true" ? true : value === "false" ? false : value,
  }));

  const { data, error } = await supabase.rpc("submit_survey_run", {
    p_session_id: sessionId,
    p_survey_id: surveyId,
    p_answers: payload,
  });
  if (error) return { ok: false, message: error.message };
  const result = data as { ok: boolean; saved?: number; error?: string } | null;
  if (!result?.ok) return { ok: false, message: result?.error ?? "Submission failed." };

  revalidatePath("/research/surveys");
  revalidatePath("/sponsors");
  return { ok: true, message: `Survey complete — ${result.saved ?? answers.length} response(s) saved.` };
}

// ------------------------------------------------------------ event check-in
/** Self-service / staff check-in. Auto-registers unknown participant codes. */
export async function checkInParticipant(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const eventId = String(formData.get("event_id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const method = String(formData.get("method") ?? "manual");
  if (!eventId || !code) return { ok: false, message: "Event and participant code are required." };

  if (!isUuid(eventId)) return { ok: false, message: "Invalid event reference." };

  // Kiosk flow: unauthenticated attendees check in through the
  // security-definer RPC (auto-registers unknown codes, dedupes repeats).
  const supabase = await createClient();
  if (!supabase) return { ok: true, message: `Demo mode: ${code} would be checked in.` };

  const { data, error } = await supabase.rpc("check_in_event", {
    p_event_id: eventId,
    p_code: code,
    p_method: method,
  });
  if (error) return { ok: false, message: error.message };
  const result = data as { ok: boolean; duplicate?: boolean; error?: string } | null;
  if (!result?.ok) return { ok: false, message: result?.error ?? "Check-in failed." };
  if (result.duplicate) return { ok: true, message: `${code} is already checked in.` };

  revalidatePath(`/checkin/${eventId}`);
  revalidatePath(`/field/events/${eventId}`);
  revalidatePath("/field");
  return { ok: true, message: `${code} checked in.` };
}

// --------------------------------------------------------- brand mentions
/** Manual tally entry for announcements, shout-outs, and verbal mentions. */
export async function logBrandMention(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const sponsorId = String(formData.get("sponsor_id") ?? "");
  const phrase = String(formData.get("phrase") ?? "").trim();
  const requestedSource = String(formData.get("source") ?? "manual");
  const allowedSources = ["survey_response", "session_note", "event_announcement", "manual"];
  const source = allowedSources.includes(requestedSource) ? requestedSource : "manual";
  const contextRef = str(formData, "context_ref");
  if (!sponsorId || !phrase) return { ok: false, message: "Sponsor and mention text are required." };

  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "sponsor_manager", "field_operator"]);
  if (authorizationError) return { ok: false, message: authorizationError };
  if (!supabase) return { ok: true, message: `Demo mode: mention would be tallied for "${phrase}".` };

  if (contextRef && source === "event_announcement") {
    const { data: matchingEvent } = await supabase
      .from("events").select("id").eq("id", contextRef).maybeSingle();
    if (!matchingEvent) return { ok: false, message: "The linked event was not found." };
  }

  const { error } = await supabase.from("brand_mentions").insert({
    sponsor_id: sponsorId,
    source,
    context_ref: contextRef,
    phrase,
  });
  if (fail(error)) return fail(error)!;
  revalidatePath("/sponsors");
  if (contextRef) revalidatePath(`/field/events/${contextRef}`);
  return { ok: true, message: "Mention tallied." };
}

// ------------------------------------------------------------------ content
export async function createContent(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { client: supabase, error: authorizationError } = await sb(["admin", "executive", "researcher", "storefront"]);
  if (authorizationError) return { ok: false, message: authorizationError };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "Title is required." };

  if (!supabase) return { ok: true, message: `Demo mode: "${title}" would be added to the media library.` };

  const status = str(formData, "status") ?? "draft";
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      title,
      content_type: str(formData, "content_type") ?? "article",
      status,
      body_md: str(formData, "body_md"),
      media_url: str(formData, "media_url"),
      author_person_id: str(formData, "author_person_id"),
      study_id: str(formData, "study_id"),
      game_id: str(formData, "game_id"),
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (fail(error)) return fail(error)!;
  revalidatePath("/content");
  return { ok: true, message: `"${title}" added to the media library.` };
}

// ------------------------------------------------------------------ auth
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

// ------------------------------------------------------------------ helpers
function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function num(formData: FormData, key: string): number | null {
  const v = String(formData.get(key) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
