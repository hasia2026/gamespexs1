// ============================================================================
// DEMO MODE DATA — mirrors supabase/migrations/0002_seed.sql
// Used whenever Supabase env vars are absent, so the platform is fully
// explorable before the database is provisioned.
// ============================================================================

import type {
  AuditEntry, DashboardStats, Game, GameMechanic, Location, Participant,
  Person, ResearchSession, Study, Survey, SurveyQuestion, SurveyResponse,
  SessionMetric, ResearchFinding, ResearchReport, BrandMention,
} from "./types";

const daysAgo = (n: number, hour = 14): string =>
  new Date(Date.now() - n * 86_400_000 - (16 - hour) * 3_600_000).toISOString();

export const demoOrganizations = [
  { id: "org-1", name: "GAMESPEXS", slug: "gamespexs", org_type: "internal", website: "https://gamespexs.example" },
];

export const demoLocations: Location[] = [
  { id: "loc-1", organization_id: "org-1", name: "GAMESPEXS Flagship Storefront", location_type: "storefront", city: "Columbus", state: "OH", county: "Franklin", is_active: true },
  { id: "loc-2", organization_id: "org-1", name: "Linden Park Mobile Stop", location_type: "mobile_stop", city: "Columbus", state: "OH", county: "Franklin", is_active: true },
  { id: "loc-3", organization_id: "org-1", name: "Eastmoor Community Center", location_type: "venue", city: "Columbus", state: "OH", county: "Franklin", is_active: true },
  { id: "loc-4", organization_id: "org-1", name: "Franklin County Corrections — Closed Network", location_type: "institutional", city: "Columbus", state: "OH", county: "Franklin", is_active: true },
  { id: "loc-5", organization_id: "org-1", name: "GAMESPEXS Research Lab", location_type: "research_lab", city: "Columbus", state: "OH", county: "Franklin", is_active: true },
];

export const demoPeople: Person[] = [
  { id: "per-1", organization_id: "org-1", full_name: "Dana Okafor", email: "dana@gamespexs.example", phone: null, person_type: "researcher", is_active: true },
  { id: "per-2", organization_id: "org-1", full_name: "Marcus Lee", email: "marcus@gamespexs.example", phone: null, person_type: "interviewer", is_active: true },
  { id: "per-3", organization_id: "org-1", full_name: "Priya Raman", email: "priya@gamespexs.example", phone: null, person_type: "judge", is_active: true },
  { id: "per-4", organization_id: "org-1", full_name: "Tom Vargas", email: "tom@gamespexs.example", phone: null, person_type: "community_worker", is_active: true },
  { id: "per-5", organization_id: "org-1", full_name: "Elena Ruiz", email: "elena@gamespexs.example", phone: null, person_type: "contractor", is_active: true },
];

export const demoCategories = [
  { id: "cat-video", name: "Video Games", description: "Digital and closed-network game titles" },
  { id: "cat-board", name: "Board Games", description: "Tabletop board games" },
  { id: "cat-card", name: "Card Games", description: "Playing-card and trading-card games" },
  { id: "cat-paper", name: "Paper Games", description: "Pencil-and-paper games, puzzles, mazes" },
  { id: "cat-sports", name: "Sports / Team Games", description: "Physical and team-based games" },
  { id: "cat-odd", name: "Odd Games", description: "Novel, experimental, and unusual games" },
];

const game = (
  id: string, title: string, cat: string, publisher: string, year: number,
  minp: number, maxp: number, mins: number, cx: Game["complexity"], descr: string,
  closed = false,
): Game => ({
  id, title, category_id: cat, publisher, year_released: year,
  min_players: minp, max_players: maxp, play_minutes: mins,
  complexity: cx, is_closed_network: closed, description: descr, is_active: true,
});

export const demoGames: Game[] = [
  game("gm-1", "Cohort Zero", "cat-video", "Closed Network Studios", 2025, 1, 1, 25, "medium", "Closed-network research title for institutional deployment.", true),
  game("gm-2", "Grid Runner", "cat-video", "CN Studios", 2024, 1, 4, 15, "low", "Reaction-time runner used in engagement studies."),
  game("gm-3", "Kingdoms of Ash", "cat-board", "TableRock", 2019, 2, 5, 90, "high", "Strategy board game used in group-decision research."),
  game("gm-4", "Patchwork Prairie", "cat-board", "TableRock", 2021, 2, 4, 45, "medium", "Tile-laying board game."),
  game("gm-5", "Skull Deck", "cat-card", "In-house", 2022, 2, 6, 20, "low", "House card game with rapid round resolution."),
  game("gm-6", "Cipher Sheets", "cat-paper", "In-house", 2023, 1, 8, 30, "low", "Pencil-and-paper deduction packet."),
  game("gm-7", "Bucket Line Relay", "cat-sports", "In-house", 2020, 6, 12, 20, "low", "Team relay game for field events."),
  game("gm-8", "The Odd Orb", "cat-odd", "In-house", 2024, 1, 3, 10, "low", "Experimental physical-dexterity game."),
];

export const demoMechanics: GameMechanic[] = [
  { id: "mec-1", name: "Turn Order", description: "Structured sequencing of player actions" },
  { id: "mec-2", name: "Resource Management", description: "Acquiring and spending limited resources" },
  { id: "mec-3", name: "Reaction Time", description: "Speed-of-response under stimulus" },
  { id: "mec-4", name: "Deduction", description: "Inferring hidden information" },
  { id: "mec-5", name: "Cooperation", description: "Joint objectives requiring coordination" },
  { id: "mec-6", name: "Risk Assessment", description: "Choices under uncertainty" },
];

export const demoGameMechanics: Array<{ game_id: string; mechanic_id: string }> = [
  { game_id: "gm-1", mechanic_id: "mec-3" }, { game_id: "gm-1", mechanic_id: "mec-4" },
  { game_id: "gm-2", mechanic_id: "mec-3" },
  { game_id: "gm-3", mechanic_id: "mec-2" }, { game_id: "gm-3", mechanic_id: "mec-6" },
  { game_id: "gm-4", mechanic_id: "mec-2" },
  { game_id: "gm-5", mechanic_id: "mec-4" },
  { game_id: "gm-6", mechanic_id: "mec-4" },
  { game_id: "gm-7", mechanic_id: "mec-5" },
  { game_id: "gm-8", mechanic_id: "mec-6" },
];

export const demoStudies: Study[] = [
  { id: "std-1", organization_id: "org-1", code: "GSX-2026-001", title: "Engagement Baseline Study", research_question: "Which game mechanics sustain engagement the longest?", status: "active", starts_on: "2026-08-01", ends_on: "2026-12-31", lead_person_id: "per-1" },
  { id: "std-2", organization_id: "org-1", code: "GSX-2026-002", title: "Closed-Network Pilot", research_question: "Can closed-network game sessions reduce reported tension in institutional settings?", status: "active", starts_on: "2026-09-01", ends_on: "2027-02-28", lead_person_id: "per-1" },
  { id: "std-3", organization_id: "org-1", code: "GSX-2026-003", title: "Odd Games Field Trial", research_question: "Do novel games produce higher curiosity metrics than familiar formats?", status: "draft", starts_on: "2026-10-15", ends_on: "2027-01-31", lead_person_id: "per-1" },
];

const participant = (i: number, by: number, g: string, d: number): Participant => ({
  id: `part-${i}`,
  organization_id: "org-1",
  code: `P-${String(i).padStart(4, "0")}`,
  display_name: `Participant ${i}`,
  birth_year: by, gender: g,
  city: "Columbus", county: "Franklin", state: "OH",
  consent_given: true,
  consent_at: daysAgo(d),
  is_institutional: false,
});

export const demoParticipants: Participant[] = Array.from({ length: 14 }, (_, i) => {
  const birthYears = [1998, 2001, 1995, 1987, 1979, 1993, 2004, 2000, 1996, 1988, 1972, 1999, 1991, 2003];
  const genders = ["F", "M", "F", "M", "F", "M", "F", "M", "M", "F", "M", "F", "M", "F"];
  const consents = [40, 38, 36, 33, 29, 27, 21, 18, 15, 12, 9, 6, 4, 2];
  return participant(i + 1, birthYears[i], genders[i], consents[i]);
});

// Data-quality demo fixtures: one duplicate registration code,
// one missing consent record.
demoParticipants[10] = { ...demoParticipants[10], code: "P-0004" };
demoParticipants[13] = { ...demoParticipants[13], consent_given: false, consent_at: null };

interface SessionSeed { study: string; participant: number; game: string; loc: string; days: number; dur: number; channel: ResearchSession["channel"]; }

const sessionSeeds: SessionSeed[] = [
  { study: "std-1", participant: 1, game: "gm-2", loc: "loc-1", days: 33, dur: 15, channel: "storefront" },
  { study: "std-1", participant: 2, game: "gm-3", loc: "loc-1", days: 31, dur: 90, channel: "storefront" },
  { study: "std-1", participant: 3, game: "gm-2", loc: "loc-1", days: 29, dur: 14, channel: "storefront" },
  { study: "std-2", participant: 4, game: "gm-1", loc: "loc-4", days: 27, dur: 25, channel: "institutional" },
  { study: "std-1", participant: 5, game: "gm-4", loc: "loc-2", days: 25, dur: 45, channel: "mobile_unit" },
  { study: "std-1", participant: 6, game: "gm-5", loc: "loc-1", days: 23, dur: 18, channel: "storefront" },
  { study: "std-1", participant: 7, game: "gm-6", loc: "loc-3", days: 21, dur: 28, channel: "event" },
  { study: "std-2", participant: 8, game: "gm-1", loc: "loc-4", days: 19, dur: 22, channel: "institutional" },
  { study: "std-1", participant: 9, game: "gm-2", loc: "loc-1", days: 17, dur: 13, channel: "storefront" },
  { study: "std-1", participant: 10, game: "gm-8", loc: "loc-2", days: 15, dur: 11, channel: "mobile_unit" },
  { study: "std-1", participant: 11, game: "gm-3", loc: "loc-3", days: 13, dur: 85, channel: "event" },
  { study: "std-1", participant: 12, game: "gm-2", loc: "loc-1", days: 11, dur: 15, channel: "storefront" },
  { study: "std-1", participant: 13, game: "gm-4", loc: "loc-1", days: 9, dur: 40, channel: "storefront" },
  { study: "std-1", participant: 14, game: "gm-5", loc: "loc-2", days: 7, dur: 17, channel: "mobile_unit" },
  { study: "std-1", participant: 1, game: "gm-8", loc: "loc-1", days: 5, dur: 12, channel: "storefront" },
  { study: "std-2", participant: 4, game: "gm-1", loc: "loc-4", days: 3, dur: 24, channel: "institutional" },
  { study: "std-1", participant: 6, game: "gm-2", loc: "loc-1", days: 2, dur: 16, channel: "storefront" },
];

export const demoSessions: ResearchSession[] = sessionSeeds.map((s, i) => ({
  id: `sess-${String(i + 1).padStart(3, "0")}`,
  study_id: s.study,
  participant_id: `part-${s.participant}`,
  game_id: s.game,
  location_id: s.loc,
  session_date: daysAgo(s.days),
  duration_minutes: s.dur,
  interviewer_id: "per-2",
  channel: s.channel,
  status: "complete",
}));

export const demoSurvey: Survey = {
  id: "srv-1",
  study_id: "std-1",
  title: "Post-Session Engagement Survey",
  description: "Blueprint-standard 10–12 minute instrument, 12 questions.",
  estimated_minutes: 12,
  question_limit: 15,
  status: "active",
};

export const demoQuestions: SurveyQuestion[] = [
  { id: "q-1", survey_id: "srv-1", ordinal: 1, prompt: "How fun was the game overall?", question_type: "likert_5", options: ["Not fun", "Slightly fun", "Moderately fun", "Very fun", "Extremely fun"], required: true },
  { id: "q-2", survey_id: "srv-1", ordinal: 2, prompt: "How difficult was the game to learn?", question_type: "likert_5", options: ["Very easy", "Easy", "Neutral", "Hard", "Very hard"], required: true },
  { id: "q-3", survey_id: "srv-1", ordinal: 3, prompt: "How focused did you feel while playing?", question_type: "rating_10", options: [], required: true },
  { id: "q-4", survey_id: "srv-1", ordinal: 4, prompt: "Would you play this game again?", question_type: "boolean", options: [], required: true },
  { id: "q-5", survey_id: "srv-1", ordinal: 5, prompt: "Which part did you enjoy most?", question_type: "multiple_choice", options: ["Setup", "Early game", "Mid game", "Endgame"], required: true },
  { id: "q-6", survey_id: "srv-1", ordinal: 6, prompt: "How often do you play games like this?", question_type: "multiple_choice", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"], required: true },
  { id: "q-7", survey_id: "srv-1", ordinal: 7, prompt: "Did the session hold your attention?", question_type: "boolean", options: [], required: true },
  { id: "q-8", survey_id: "srv-1", ordinal: 8, prompt: "How likely are you to recommend this game?", question_type: "rating_10", options: [], required: true },
  { id: "q-9", survey_id: "srv-1", ordinal: 9, prompt: "Was the session length appropriate?", question_type: "likert_5", options: ["Much too short", "Too short", "Right length", "Too long", "Much too long"], required: true },
  { id: "q-10", survey_id: "srv-1", ordinal: 10, prompt: "Did you feel time pass quickly?", question_type: "likert_5", options: ["Not at all", "Slightly", "Moderately", "Mostly", "Completely"], required: true },
  { id: "q-11", survey_id: "srv-1", ordinal: 11, prompt: "What would you change about the game?", question_type: "free_text", options: [], required: false },
  { id: "q-12", survey_id: "srv-1", ordinal: 12, prompt: "Any other comments?", question_type: "free_text", options: [], required: false },
];

// Deterministic pseudo-random for stable demo numbers.
const seeded = (seed: number) => {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
};

const rand = seeded(42);

export const demoResponses: SurveyResponse[] = demoSessions.flatMap((sess) =>
  demoQuestions.map((q) => {
    let value: unknown;
    // Data-quality demo fixture: sess-009 is a planted "straightliner"
    // (same answer for every question, flagged by the Quality dashboard).
    const straightline = sess.id === "sess-009";
    switch (q.question_type) {
      case "likert_5":
        value = straightline
          ? (q.options as string[])[2]
          : (q.options as string[])[Math.floor(rand() * (q.options as string[]).length)];
        break;
      case "rating_10": value = straightline ? 4 : 1 + Math.floor(rand() * 10); break;
      case "boolean": value = straightline ? true : rand() < 0.7; break;
      case "multiple_choice":
        value = straightline
          ? (q.options as string[])[0]
          : (q.options as string[])[Math.floor(rand() * (q.options as string[]).length)];
        break;
      default: value = straightline ? "Consistent response." : "Automated seed comment for research demonstration purposes.";
    }
    return {
      id: `resp-${sess.id}-${q.id}`,
      session_id: sess.id,
      question_id: q.id,
      response_value: value,
      answered_at: sess.session_date,
    };
  }),
);

const metricKeys: Array<[string, number, number, string, string]> = [
  ["engagement_score", 6.0, 9.5, "index", "manual"],
  ["reaction_time_ms", 280, 520, "ms", "game_log"],
  ["gaze_fixation_count", 40, 120, "count", "eye_tracker"],
  ["heatmap_density", 0.2, 0.9, "ratio", "eye_tracker"],
  ["persistence_events", 2, 18, "count", "game_log"],
];

export const demoMetrics: SessionMetric[] = demoSessions.flatMap((sess) =>
  metricKeys.map(([key, lo, hi, unit, src]) => ({
    id: `met-${sess.id}-${key}`,
    session_id: sess.id,
    metric_key: key,
    metric_value: Math.round((lo + rand() * (hi - lo)) * 100) / 100,
    unit,
    captured_at: sess.session_date,
    source: src,
  })),
);

export const demoFindings: ResearchFinding[] = [
  {
    id: "fnd-1",
    study_id: "std-1",
    title: "Reaction mechanics drive repeat engagement",
    summary: "Sessions featuring reaction-time mechanics averaged higher engagement scores and more persistence events.",
    confidence: "supported",
    created_at: daysAgo(6),
  },
];

export const demoReports: ResearchReport[] = [
  {
    id: "rpt-1",
    study_id: "std-1",
    title: "Interim Report — Engagement Baseline (Q3)",
    body_md: "# Interim Report — Engagement Baseline (Q3)\n\n## Method\nSeventeen research sessions across storefront, mobile-unit, and institutional channels.\n\n## Preliminary findings\nReaction-mechanic games showed the strongest engagement persistence.\n\n## Next steps\nExtend the participant pool and attach full eye-tracking sessions.",
    status: "draft",
    published_at: null,
    created_at: daysAgo(4),
  },
];

export const demoAudit: AuditEntry[] = [
  { id: 42, occurred_at: daysAgo(1, 10), actor_id: null, table_name: "research_sessions", record_id: "sess-017", action: "INSERT" },
  { id: 41, occurred_at: daysAgo(2, 9), actor_id: null, table_name: "survey_responses", record_id: "resp-…", action: "INSERT" },
  { id: 40, occurred_at: daysAgo(2, 11), actor_id: null, table_name: "participants", record_id: "part-14", action: "INSERT" },
  { id: 39, occurred_at: daysAgo(3, 16), actor_id: null, table_name: "session_metrics", record_id: "met-…", action: "INSERT" },
  { id: 38, occurred_at: daysAgo(5, 13), actor_id: null, table_name: "games", record_id: "gm-8", action: "INSERT" },
];

export const demoDashboardStats: DashboardStats = {
  active_studies: 2,
  total_participants: demoParticipants.length,
  sessions_this_month: demoSessions.filter((s) => {
    const d = new Date(s.session_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length,
  sessions_total: demoSessions.length,
  games_tracked: demoGames.length,
  responses_captured: demoResponses.length,
  metrics_captured: demoMetrics.length,
  people_count: demoPeople.length,
  locations_count: demoLocations.length,
};

// ============================================================================
// PHASE 3 — FIELD OPERATIONS + GAZE DEMO DATA
// ============================================================================

import type {
  Equipment, EventCheckin, EventSponsorship, FieldTeam, GazeFixation,
  GsxEvent, MobileUnit, Route, Sponsor, SponsorPackage,
} from "./types";

export const demoUnits: MobileUnit[] = [
  { id: "unit-1", organization_id: "org-1", name: "Unit One — Franklin", call_sign: "GSX-1", make_model: "Ford Transit High Roof", status: "active" },
  { id: "unit-2", organization_id: "org-1", name: "Unit Two — Northeast", call_sign: "GSX-2", make_model: "Mercedes Sprinter 2500", status: "active" },
  { id: "unit-3", organization_id: "org-1", name: "Unit Three — Reserve", call_sign: "GSX-3", make_model: "Ford Transit Medium Roof", status: "maintenance" },
];

export const demoRoutes: Route[] = [
  {
    id: "rt-1", mobile_unit_id: "unit-1", name: "Northeast Corridor Run",
    route_date: daysAgo(12).slice(0, 10), status: "complete", unit: demoUnits[0],
    stops: [
      { id: "rs-1", route_id: "rt-1", location_id: "loc-3", stop_order: 1, arrive_at: "09:00", depart_at: "11:30" },
      { id: "rs-2", route_id: "rt-1", location_id: "loc-2", stop_order: 2, arrive_at: "12:30", depart_at: "15:00" },
    ],
  },
  {
    id: "rt-2", mobile_unit_id: "unit-2", name: "Linden Park Loop",
    route_date: daysAgo(5).slice(0, 10), status: "complete", unit: demoUnits[1],
    stops: [
      { id: "rs-3", route_id: "rt-2", location_id: "loc-1", stop_order: 1, arrive_at: "10:00", depart_at: "13:00" },
      { id: "rs-4", route_id: "rt-2", location_id: "loc-2", stop_order: 2, arrive_at: "14:00", depart_at: "17:00" },
    ],
  },
  {
    id: "rt-3", mobile_unit_id: "unit-1", name: "Eastmoor Circuit",
    route_date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    status: "planned", unit: demoUnits[0],
    stops: [
      { id: "rs-5", route_id: "rt-3", location_id: "loc-3", stop_order: 1, arrive_at: "09:30", depart_at: "12:00" },
      { id: "rs-6", route_id: "rt-3", location_id: "loc-2", stop_order: 2, arrive_at: "13:30", depart_at: "16:30" },
    ],
  },
];

export const demoEvents: GsxEvent[] = [
  { id: "evt-1", code: "EVT-2026-014", title: "Linden Park Game Day", event_type: "community", status: "complete", starts_at: daysAgo(5, 11), ends_at: daysAgo(5, 15), location_id: "loc-2", study_id: "std-1", expected_attendance: 120, location: demoLocations[1], study: demoStudies[0] },
  { id: "evt-2", code: "EVT-2026-015", title: "Eastmoor Family Night", event_type: "community", status: "planned", starts_at: daysAgo(-7, 17), ends_at: daysAgo(-7, 21), location_id: "loc-3", study_id: "std-1", expected_attendance: 200, location: demoLocations[2], study: demoStudies[0] },
  { id: "evt-3", code: "EVT-2026-016", title: "Closed-Network Session Block", event_type: "institutional", status: "planned", starts_at: daysAgo(-10, 9), ends_at: daysAgo(-10, 13), location_id: "loc-4", study_id: "std-2", expected_attendance: 40, location: demoLocations[3], study: demoStudies[1] },
  { id: "evt-4", code: "EVT-2026-017", title: "Sponsor Activation — Corridor Run", event_type: "sponsor_activation", status: "complete", starts_at: daysAgo(12, 12), ends_at: daysAgo(12, 16), location_id: "loc-3", study_id: "std-1", expected_attendance: 90, location: demoLocations[2], study: demoStudies[0] },
];

export const demoTeams: FieldTeam[] = [
  {
    id: "team-1", name: "Franklin Day Team",
    members: [
      { person: demoPeople[0], role_on_team: "lead" },
      { person: demoPeople[1], role_on_team: "interviewer" },
      { person: demoPeople[2], role_on_team: "judge" },
    ],
  },
  {
    id: "team-2", name: "Corridor Night Crew",
    members: [
      { person: demoPeople[3], role_on_team: "lead" },
      { person: demoPeople[4], role_on_team: "driver" },
    ],
  },
];

export const demoTeamAssignments: Array<{ event_id: string; team_id: string }> = [
  { event_id: "evt-1", team_id: "team-1" },
  { event_id: "evt-2", team_id: "team-1" },
  { event_id: "evt-3", team_id: "team-2" },
  { event_id: "evt-4", team_id: "team-2" },
];

export const demoEquipment: Equipment[] = [
  { id: "eq-1", organization_id: "org-1", name: "Tobii Eye Tracker 5", equipment_type: "eye_tracker", serial_number: "TOB-88231", status: "in_use", assigned_unit_id: "unit-1", unit: demoUnits[0] },
  { id: "eq-2", organization_id: "org-1", name: "PlayStation 5 — Unit 1", equipment_type: "console", serial_number: "PS5-11452", status: "in_use", assigned_unit_id: "unit-1", unit: demoUnits[0] },
  { id: "eq-3", organization_id: "org-1", name: "Nintendo Switch OLED — Unit 2", equipment_type: "console", serial_number: "NSW-77341", status: "ready", assigned_unit_id: "unit-2", unit: demoUnits[1] },
  { id: "eq-4", organization_id: "org-1", name: "55in Field Display", equipment_type: "display", serial_number: "DSP-55210", status: "in_use", assigned_unit_id: "unit-1", unit: demoUnits[0] },
  { id: "eq-5", organization_id: "org-1", name: "Meta Quest 3", equipment_type: "vr_headset", serial_number: "MQ3-00913", status: "maintenance", assigned_unit_id: null, unit: null },
  { id: "eq-6", organization_id: "org-1", name: "Survey Tablet A", equipment_type: "tablet", serial_number: "TAB-44712", status: "ready", assigned_unit_id: null, unit: null },
  { id: "eq-7", organization_id: "org-1", name: "Survey Tablet B", equipment_type: "tablet", serial_number: "TAB-44713", status: "ready", assigned_unit_id: null, unit: null },
  { id: "eq-8", organization_id: "org-1", name: "Vehicle Rack System 1", equipment_type: "vehicle_rack", serial_number: "RCK-10021", status: "ready", assigned_unit_id: "unit-1", unit: demoUnits[0] },
  { id: "eq-9", organization_id: "org-1", name: "Vehicle Rack System 2", equipment_type: "vehicle_rack", serial_number: "RCK-10022", status: "ready", assigned_unit_id: "unit-2", unit: demoUnits[1] },
];

export const demoCheckins: EventCheckin[] = [
  "P-0001", "P-0002", "P-0003", "P-0005", "P-0007", "P-0009", "P-0010", "P-0012",
].map((code, i) => {
  const participant = demoParticipants.find((p) => p.code === code);
  return {
    id: `chk-${i + 1}`,
    event_id: "evt-1",
    participant_id: participant!.id,
    checked_in_at: new Date(new Date(demoEvents[0].starts_at).getTime() + (5 + i * 22) * 60_000).toISOString(),
    method: ["qr", "qr", "manual", "qr", "qr", "roster", "qr", "qr"][i],
    participant,
  };
});

// Deterministic gaze fixation clusters for the latest storefront Grid Runner session.
export const demoGazeSessionId = "sess-017";

const gazeRand = seeded(7);
const clusters = [
  { cx: 30, cy: 28 },
  { cx: 52, cy: 45 },
  { cx: 68, cy: 62 },
];

export const demoGaze: GazeFixation[] = clusters.flatMap((c, ci) =>
  Array.from({ length: 12 }, (_, i) => {
    const clamp = (v: number) => Math.max(2, Math.min(98, v));
    return {
      id: `gaze-${ci}-${i}`,
      session_id: demoGazeSessionId,
      x: Math.round(clamp(c.cx + (gazeRand() - 0.5) * 14) * 100) / 100,
      y: Math.round(clamp(c.cy + (gazeRand() - 0.5) * 14) * 100) / 100,
      duration_ms: 120 + Math.floor(gazeRand() * 380),
      captured_at: demoSessions[16].session_date,
    };
  }),
);

export const demoBrandMentions: BrandMention[] = [
  { id: "bm-1", sponsor_id: "sp-1", source: "survey_response", context_ref: "sess-003", phrase: "Feels like a night at Buckeye Family Fun Centers", occurred_at: daysAgo(29) },
  { id: "bm-2", sponsor_id: "sp-1", source: "event_announcement", context_ref: "evt-1", phrase: "Prize table sponsored by Buckeye Family Fun Centers", occurred_at: daysAgo(5) },
  { id: "bm-3", sponsor_id: "sp-1", source: "survey_response", context_ref: "sess-007", phrase: "Reminded me of Buckeye Family Fun Centers arcade nights", occurred_at: daysAgo(21) },
  { id: "bm-4", sponsor_id: "sp-2", source: "event_announcement", context_ref: "evt-1", phrase: "Welcome from Columbus Parks & Rec", occurred_at: daysAgo(5) },
  { id: "bm-5", sponsor_id: "sp-2", source: "session_note", context_ref: "sess-010", phrase: "Participant mentioned Columbus Parks & Rec summer league", occurred_at: daysAgo(15) },
  { id: "bm-6", sponsor_id: "sp-3", source: "survey_response", context_ref: "sess-011", phrase: "Would be great for Pixel Bistro trivia night", occurred_at: daysAgo(13) },
];

export const demoSponsors: Sponsor[] = [
  { id: "sp-1", name: "Buckeye Family Fun Centers", tier: "gold", contact_name: "Rita Meyer", contact_email: "rita@bffcenters.example", is_prize_partner: true },
  { id: "sp-2", name: "Columbus Parks & Rec", tier: "silver", contact_name: "Andre Cole", contact_email: "andre@colsrec.example", is_prize_partner: false },
  { id: "sp-3", name: "Pixel Bistro", tier: "bronze", contact_name: "Sam Nguyen", contact_email: "sam@pixelbistro.example", is_prize_partner: true },
];

export const demoSponsorPackages: SponsorPackage[] = [
  { id: "pkg-1", sponsor_id: "sp-1", name: "2026 Q4 Community Package", ad_slots: 3, price_cents: 250000, period_start: "2026-10-01", period_end: "2026-12-31", sponsor: demoSponsors[0] },
];

export const demoSponsorships: EventSponsorship[] = [
  { id: "esp-1", event_id: "evt-4", package_id: "pkg-1", fee_cents: 85000, event: demoEvents[3], package: demoSponsorPackages[0] },
];

// ============================================================================
// PHASE 5/6 — INSTITUTIONAL + CONTENT DEMO DATA
// ============================================================================

import type { ContentItem, Grant, InstitutionalProgram } from "./types";

export const demoGrants: Grant[] = [
  { id: "gr-1", funder: "Institute of Museum and Library Services", agency_type: "government", title: "Community Learning Through Games", program_area: "Community engagement research", amount_cents: 5000000, status: "submitted", starts_on: "2026-10-01", ends_on: "2027-09-30", study_id: "std-1", notes: null },
  { id: "gr-2", funder: "Ohio Arts Council", agency_type: "government", title: "Playful Heritage Documentation", program_area: "Game culture archiving", amount_cents: 1200000, status: "awarded", starts_on: "2026-09-01", ends_on: "2027-08-31", study_id: null, notes: null },
  { id: "gr-3", funder: "Buckeye Family Fun Centers", agency_type: "corporate", title: "Prize Partner Research Match", program_area: "Engagement baseline co-funding", amount_cents: 250000, status: "awarded", starts_on: "2026-10-01", ends_on: "2026-12-31", study_id: "std-1", notes: null },
  { id: "gr-4", funder: "Franklin County Justice Programs Office", agency_type: "government", title: "Closed-Network Pilot Evaluation", program_area: "Institutional research", amount_cents: 0, status: "prospect", starts_on: null, ends_on: null, study_id: "std-2", notes: null },
];

export const demoPrograms: InstitutionalProgram[] = [
  {
    id: "prg-1", partner_org_id: "org-2", program_type: "corrections",
    title: "Closed-Network Sessions — Corrections Pilot",
    description: "Structured Cohort Zero sessions under facility supervision with documented consent protocol.",
    status: "active", site_location_id: "loc-4", is_closed_network: true,
    consent_protocol_notes: "Facility-approved intake script; consent re-verified each session; no personal devices permitted.",
    starts_on: "2026-09-01", ends_on: null,
    partner_org: demoOrganizations[1],
    site_location: demoLocations[3],
  },
  {
    id: "prg-2", partner_org_id: "org-2", program_type: "corrections",
    title: "Reintegration Skills Ladder",
    description: "Cooperative gameplay progression supporting pre-release programming.",
    status: "planning", site_location_id: "loc-4", is_closed_network: true,
    consent_protocol_notes: "Pending facility review board sign-off.",
    starts_on: null, ends_on: null,
    partner_org: demoOrganizations[1],
    site_location: demoLocations[3],
  },
  {
    id: "prg-3", partner_org_id: "org-3", program_type: "education",
    title: "After-School Board Game Cohorts",
    description: "Weekly board-game cohorts studying turn-taking and persistence in middle schoolers.",
    status: "planning", site_location_id: null, is_closed_network: false,
    consent_protocol_notes: "Parental consent forms required before any data collection.",
    starts_on: null, ends_on: null,
    partner_org: demoOrganizations[2],
    site_location: undefined,
  },
];

export const demoContentItems: ContentItem[] = [
  {
    id: "cnt-1", title: "Why reaction mechanics keep players coming back",
    content_type: "article", status: "published",
    body_md: "## The signal\nAcross 17 sessions, games tagged with reaction-time mechanics showed the strongest persistence markers.\n\n## What participants said\nThe engagement survey's free-text answers repeatedly named focus and flow.",
    media_url: null, author_person_id: "per-1", study_id: "std-1", game_id: "gm-2",
    published_at: daysAgo(6), author: demoPeople[0], study: demoStudies[0], game: demoGames[1],
  },
  {
    id: "cnt-2", title: "Game Guide: Grid Runner basics",
    content_type: "game_guide", status: "published",
    body_md: "## Setup\nGrid Runner runs 15 minutes for 1-4 players.\n\n## Research notes\nReaction-time telemetry logs at 50ms resolution.",
    media_url: null, author_person_id: "per-1", study_id: null, game_id: "gm-2",
    published_at: daysAgo(12), author: demoPeople[0], study: undefined, game: demoGames[1],
  },
  {
    id: "cnt-3", title: "Field notes: Linden Park Game Day",
    content_type: "article", status: "draft",
    body_md: "## Draft\nEight check-ins via QR, two walk-up registrations, judges ran three rotation blocks.",
    media_url: null, author_person_id: "per-4", study_id: "std-1", game_id: null,
    published_at: null, author: demoPeople[3], study: demoStudies[0], game: undefined,
  },
  {
    id: "cnt-4", title: "Closed-network pilot: behind the scenes",
    content_type: "video", status: "review",
    body_md: null,
    media_url: "https://media.example/pilot-bts", author_person_id: "per-5", study_id: "std-2", game_id: "gm-1",
    published_at: null, author: demoPeople[4], study: demoStudies[1], game: demoGames[0],
  },
];
