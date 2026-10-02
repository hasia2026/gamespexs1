// ============================================================================
// GAMESPEXS data access layer.
// Every getter reads from Supabase when configured; otherwise it falls back
// to the in-repo demo dataset so the whole platform is explorable offline.
// ============================================================================

import { createClient } from "./supabase/server";
import { isDemoMode } from "./config";
import {
  demoAudit, demoBrandMentions, demoCategories, demoCheckins, demoContentItems,
  demoEquipment, demoGrants, demoOrganizations, demoPrograms,
  demoTeamAssignments,
  demoEvents, demoFindings, demoGameMechanics, demoGames, demoGaze,
  demoLocations, demoMechanics, demoMetrics, demoParticipants, demoPeople,
  demoQuestions, demoReports, demoResponses, demoRoutes, demoSessions,
  demoSponsorPackages, demoSponsorships, demoSponsors, demoStudies, demoSurvey,
  demoTeams, demoUnits, demoDashboardStats,
} from "./demo";
import type {
  AuditEntry, BrandMention, ContentItem, DashboardStats, Equipment, EventCheckin,
  EventSponsorship, FieldTeam, Game, GameCategory, GameMechanic, GazeFixation,
  Grant, GsxEvent, InstitutionalProgram, Location, MobileUnit, Participant,
  Person, ResearchFinding, ResearchReport, ResearchSession, Route, Sponsor,
  SponsorPackage, Study, Survey, SurveyQuestion, SessionMetric,
} from "./types";

export const DEMO_MODE = isDemoMode;

// ---------------------------------------------------------------- dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  if (DEMO_MODE) return demoDashboardStats;
  const supabase = await createClient();
  if (!supabase) return emptyStats();    const { data, error } = await supabase.rpc("dashboard_stats");
  if (error || !data) return emptyStats();
  return data as DashboardStats;
}

function emptyStats(): DashboardStats {
  return {
    active_studies: 0, total_participants: 0, sessions_this_month: 0,
    sessions_total: 0, games_tracked: 0, responses_captured: 0,
    metrics_captured: 0, people_count: 0, locations_count: 0,
  };
}

// ------------------------------------------------------------------ studies
export async function getStudies(): Promise<Study[]> {
  if (DEMO_MODE) return demoStudies;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("studies").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Study[];
}

// -------------------------------------------------------------------- games
export async function getGames(): Promise<Game[]> {
  if (DEMO_MODE) {
    return demoGames.map((g) => ({
      ...g,
      category: demoCategories.find((c) => c.id === g.category_id),
      mechanics: demoGameMechanics
        .filter((gm) => gm.game_id === g.id)
        .map((gm) => demoMechanics.find((m) => m.id === gm.mechanic_id))
        .filter((m): m is GameMechanic => !!m),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("games")
    .select("*, category:game_categories(*), mechanics:game_game_mechanics(game_mechanics(*))")
    .order("title");
  return ((data ?? []) as Array<Record<string, unknown>>).map((g) => ({
    ...(g as unknown as Game),
    category: g.category as Game["category"],
    mechanics: Array.isArray(g.mechanics)
      ? (g.mechanics as Array<{ game_mechanics: GameMechanic }>).map((m) => m.game_mechanics)
      : [],
  }));
}

export function getCategories() {
  if (DEMO_MODE) return Promise.resolve(demoCategories);
  return liveList<GameCategory>("game_categories", "name");
}

export function getMechanics(): Promise<GameMechanic[]> {
  if (DEMO_MODE) return Promise.resolve(demoMechanics);
  return liveList<GameMechanic>("game_mechanics", "name");
}

// ------------------------------------------------------- people & locations
export function getLocations(): Promise<Location[]> {
  if (DEMO_MODE) return Promise.resolve(demoLocations);
  return liveList<Location>("locations", "name");
}

export function getPeople(): Promise<Person[]> {
  if (DEMO_MODE) return Promise.resolve(demoPeople);
  return liveList<Person>("people", "full_name");
}

// ------------------------------------------------- community system
export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  website: string | null;
}

export function getOrganizations(): Promise<Organization[]> {
  if (DEMO_MODE) return Promise.resolve(demoOrganizations);
  return liveList<Organization>("organizations", "name");
}

export interface CommunityOverview {
  heroes: Array<{
    person: Person;
    events: number;
    locations: string[];
  }>;
  cities: Array<{
    city: string;
    county: string | null;
    state: string | null;
    locations: number;
    events: number;
    participants: number;
  }>;
  organizations: Organization[];
  events: Array<GsxEvent & { teamNames: string[] }>;
}

export async function getCommunityOverview(): Promise<CommunityOverview> {
  const [people, events, teams, locations, participants, orgs] = await Promise.all([
    getPeople(), getEvents(), getTeams(), getLocations(), getParticipants(),
    getOrganizations(),
  ]);

  const assignments = await (async () => {
    if (DEMO_MODE) return demoTeamAssignments;
    const supabase = await createClient();
    if (!supabase) return [];
    const { data } = await supabase.from("event_team_assignments").select("event_id, team_id");
    return (data ?? []) as Array<{ event_id: string; team_id: string }>;
  })();

  const teamMembers = await (async () => {
    if (DEMO_MODE) {
      return demoTeams.flatMap((t) =>
        (t.members ?? []).map((m) => ({ team_id: t.id, person_id: m.person.id })),
      );
    }
    const supabase = await createClient();
    if (!supabase) return [];
    const { data } = await supabase.from("field_team_members").select("team_id, person_id");
    return (data ?? []) as Array<{ team_id: string; person_id: string }>;
  })();

  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const heroes = people
    .filter((p) => p.person_type === "community_worker")
    .map((person) => {
      const teamIds = teamMembers.filter((tm) => tm.person_id === person.id).map((tm) => tm.team_id);
      const personEvents = assignments
        .filter((a) => teamIds.includes(a.team_id))
        .map((a) => events.find((e) => e.id === a.event_id))
        .filter((e): e is GsxEvent => !!e);
      return {
        person,
        events: personEvents.length,
      eventNames: [...new Set(personEvents.map((e) => e.title))],
        locations: [...new Set(personEvents.map((e) => e.location?.name ?? "").filter(Boolean))],
      };
    });

  const cityMap = new Map<string, CommunityOverview["cities"][number]>();
  for (const loc of locations) {
    const key = loc.city ?? "Unknown";
    let rec = cityMap.get(key);
    if (!rec) {
      rec = {
        city: key,
        county: loc.county,
        state: loc.state,
        locations: 0,
        events: 0,
        participants: 0,
      };
      cityMap.set(key, rec);
    }
    rec.locations += 1;
  }
  for (const e of events) {
    const key = e.location?.city ?? "Unknown";
    const rec = cityMap.get(key);
    if (rec) rec.events += 1;
  }
  for (const p of participants) {
    const key = p.city ?? "Unknown";
    const rec = cityMap.get(key);
 if (rec) rec.participants += 1;
  }

  const eventsWithTeams = events.map((e) => ({
    ...e,
    teamNames: assignments
      .filter((a) => a.event_id === e.id)
      .map((a) => teamsById.get(a.team_id)?.name ?? "")
      .filter(Boolean),
  }));

  return {
    heroes,
    cities: [...cityMap.values()].sort((a, b) => b.locations - a.locations),
    organizations: orgs,
    events: eventsWithTeams,
  };
}

// ------------------------------------------------------------- participants
export function getParticipants(): Promise<Participant[]> {
  if (DEMO_MODE) return Promise.resolve(demoParticipants);
  return liveList<Participant>("participants", "code");
}

// ----------------------------------------------------------------- sessions
export async function getSessions(): Promise<ResearchSession[]> {
  if (DEMO_MODE) {
    return demoSessions.map((s) => ({
      ...s,
      study: demoStudies.find((st) => st.id === s.study_id),
      participant: demoParticipants.find((p) => p.id === s.participant_id),
      game: demoGames.find((g) => g.id === s.game_id),
      location: demoLocations.find((l) => l.id === s.location_id),
      interviewer: demoPeople.find((p) => p.id === s.interviewer_id),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("research_sessions")
    .select("*, study:studies(*), participant:participants(*), game:games(*), location:locations(*), interviewer:people(*)")
    .order("session_date", { ascending: false });
  return (data ?? []) as unknown as ResearchSession[];
}

// -------------------------------------------------------- surveys & results
export function getSurveys(): Promise<Survey[]> {
  if (DEMO_MODE) return Promise.resolve([demoSurvey]);
  return liveList<Survey>("surveys", "created_at");
}

export async function getQuestions(surveyId: string): Promise<SurveyQuestion[]> {
  if (DEMO_MODE) return demoQuestions.filter((q) => q.survey_id === surveyId);
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", surveyId)
    .order("ordinal");
  return (data ?? []) as SurveyQuestion[];
}

// ------------------------------------------------------------ session detail
export async function getSessionDetail(id: string) {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === id) ?? null;
  if (!session) return null;
  const [metrics, gaze, questions] = await Promise.all([
    getSessionMetrics(id),
    getGazeFixations(id),
    getSessionQuestions(session),
  ]);
  return { session, metrics, gaze, questions };
}

async function getSessionMetrics(sessionId: string): Promise<SessionMetric[]> {
  if (DEMO_MODE) return demoMetrics.filter((m) => m.session_id === sessionId);
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("session_metrics").select("*").eq("session_id", sessionId);
  return (data ?? []) as unknown as SessionMetric[];
}

async function getSessionQuestions(session: ResearchSession) {
  if (DEMO_MODE) {
    const responses = demoResponses.filter((r) => r.session_id === session.id);
    return demoQuestions.map((q) => ({
      question: q,
      response: responses.find((r) => r.question_id === q.id)?.response_value ?? null,
    }));
  }
  const supabase = await createClient();
  if (!supabase || !session.study_id) return [];
  const { data: surveys } = await supabase
    .from("surveys").select("id").eq("study_id", session.study_id);
  const surveyIds = (surveys ?? []).map((s) => s.id);
  if (surveyIds.length === 0) return [];
  const { data: questions } = await supabase
    .from("survey_questions").select("*").in("survey_id", surveyIds).order("ordinal");
  const { data: responses } = await supabase
    .from("survey_responses").select("*").eq("session_id", session.id);
  return ((questions ?? []) as SurveyQuestion[]).map((q) => ({
    question: q,
    response: (responses ?? []).find((r) => r.question_id === q.id)?.response_value ?? null,
  }));
}

// --------------------------------------------------------- survey aggregates
export async function getSurveyResults(surveyId: string) {
  const questions = await getQuestions(surveyId);
  if (DEMO_MODE) {
    return questions.map((q) => ({
      question: q,
      distribution: buildDistribution(q, demoResponses.filter((r) => r.question_id === q.id).map((r) => r.response_value)),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: responses } = await supabase
    .from("survey_responses").select("question_id, response_value").in("question_id", questions.map((q) => q.id));
  return questions.map((q) => ({
    question: q,
    distribution: buildDistribution(q, (responses ?? []).filter((r) => r.question_id === q.id).map((r) => r.response_value)),
  }));
}

function buildDistribution(q: SurveyQuestion, values: unknown[]): Array<{ label: string; count: number }> {
  if (q.question_type === "likert_5" || q.question_type === "multiple_choice") {
    const labels = (q.options as string[]) ?? [];
    return labels.map((label) => ({ label, count: values.filter((v) => v === label).length }));
  }
  if (q.question_type === "rating_10") {
    return Array.from({ length: 10 }, (_, i) => ({
      label: String(i + 1),
      count: values.filter((v) => Number(v) === i + 1).length,
    }));
  }
  if (q.question_type === "boolean") {
    return [
      { label: "Yes", count: values.filter((v) => v === true).length },
      { label: "No", count: values.filter((v) => v === false).length },
    ];
  }
  return [];
}

export async function getFindings(): Promise<ResearchFinding[]> {
  if (DEMO_MODE) return demoFindings;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("research_findings").select("*, study:studies(code)").order("created_at", { ascending: false });
  return (data ?? []) as unknown as ResearchFinding[];
}

export async function getReports(): Promise<ResearchReport[]> {
  if (DEMO_MODE) return demoReports;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("research_reports").select("*, study:studies(code)").order("created_at", { ascending: false });
  return (data ?? []) as unknown as ResearchReport[];
}

export function getAuditLog(): Promise<AuditEntry[]> {
  if (DEMO_MODE) return Promise.resolve(demoAudit);
  return liveAudit();
}

// ------------------------------------------------------------- phase 3: field
export function getUnits(): Promise<MobileUnit[]> {
  if (DEMO_MODE) return Promise.resolve(demoUnits);
  return liveList<MobileUnit>("mobile_units", "name");
}

export async function getRoutes(): Promise<Route[]> {
  if (DEMO_MODE) {
    return demoRoutes.map((r) => ({
      ...r,
      stops: [...(r.stops ?? [])].sort((a, b) => a.stop_order - b.stop_order)
        .map((s) => ({ ...s, location: demoLocations.find((l) => l.id === s.location_id) })),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("routes")
    .select("*, unit:mobile_units(*), stops:route_stops(*, location:locations(*))")
    .order("route_date", { ascending: false });
  return (data ?? []) as unknown as Route[];
}

export interface EventOperationsSnapshot {
  event: GsxEvent;
  checkins: EventCheckin[];
  sessions: ResearchSession[];
  teams: FieldTeam[];
  equipment: Equipment[];
  sponsorships: EventSponsorship[];
  mentions: BrandMention[];
  sponsorSetupMissing: boolean;
}

export async function getEventOperationsSnapshot(eventId: string): Promise<EventOperationsSnapshot | null> {
  const events = await getEvents();
  const event = events.find((item) => item.id === eventId);
  if (!event) return null;

  const [allCheckins, sessions, allTeams, equipment, sponsorships] = await Promise.all([
    getCheckins(eventId), getSessions(), getTeams(), getEquipment(), getSponsorships(),
  ]);
  const hasBrandMentions = DEMO_MODE || await isTableAvailable("brand_mentions");
  const mentions = hasBrandMentions ? await getBrandMentions() : [];

  let assignments: Array<{ team_id: string }> = [];
  let eventEquipment: Equipment[] = equipment.filter((item) => item.assigned_event_id === eventId);
  if (!DEMO_MODE) {
    const supabase = await createClient();
    if (supabase) {
      const [{ data: teamRows }, { data: equipmentRows }] = await Promise.all([
        supabase.from("event_team_assignments").select("team_id").eq("event_id", eventId),
        supabase.from("equipment").select("*, unit:mobile_units(*)").eq("assigned_event_id", eventId),
      ]);
      assignments = (teamRows ?? []) as Array<{ team_id: string }>;
      eventEquipment = (equipmentRows ?? []) as unknown as Equipment[];
    }
  } else {
    const { demoTeamAssignments } = await import("./demo");
    assignments = demoTeamAssignments.filter((assignment) => assignment.event_id === eventId);
    eventEquipment = equipment.filter((item) => item.assigned_event_id === eventId);
  }

  const teamIds = new Set(assignments.map((assignment) => assignment.team_id));
  const assignedTeams = allTeams.filter((team) => teamIds.has(team.id));
  const startsAt = Date.parse(event.starts_at);
  const endsAt = Date.parse(event.ends_at ?? event.starts_at);
  const eventSessions = sessions.filter((session) => {
    const sessionAt = Date.parse(session.session_date);
    const sessionEventId = (session as ResearchSession & { event_id?: string }).event_id;
    return sessionEventId === eventId ||
      (session.channel === "event" && session.location_id === event.location_id &&
        (session.study_id === event.study_id || !event.study_id) &&
        sessionAt >= startsAt && sessionAt <= endsAt);
  });
  const eventSponsorships = sponsorships.filter((sponsorship) => sponsorship.event_id === eventId);
  const sponsorNames = new Set(eventSponsorships
    .map((sponsorship) => sponsorship.package?.sponsor?.name?.toLowerCase())
    .filter((name): name is string => !!name));
  const eventMentions = mentions.filter((mention) =>
    mention.context_ref === eventId ||
    (mention.source === "event_announcement" && sponsorNames.has(mention.sponsor?.name.toLowerCase() ?? "") &&
      mention.phrase.toLowerCase().includes(event.title.toLowerCase())),
  );

  return {
    event,
    checkins: allCheckins,
    sessions: eventSessions,
    teams: assignedTeams,
    equipment: eventEquipment,
    sponsorships: eventSponsorships,
    mentions: eventMentions,
    sponsorSetupMissing: !hasBrandMentions,
  };
}

async function isTableAvailable(table: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { error } = await supabase.from(table).select("id").limit(1);
  if (!error) return true;
  const message = error.message.toLowerCase();
  return !message.includes("does not exist") && !message.includes("could not find the table");
}

export async function getEventById(eventId: string): Promise<GsxEvent | null> {
  if (DEMO_MODE) return demoEvents.find((event) => event.id === eventId) ?? null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .select("*, location:locations(*), study:studies(*)")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as GsxEvent;
}

export async function getEvents(): Promise<GsxEvent[]> {
  if (DEMO_MODE) return demoEvents;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("*, location:locations(*), study:studies(*)")
    .order("starts_at", { ascending: false });
  return (data ?? []) as unknown as GsxEvent[];
}

export async function getTeams(): Promise<FieldTeam[]> {
  if (DEMO_MODE) return demoTeams;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: teams } = await supabase.from("field_teams").select("*").order("name");
  if (!teams?.length) return [];

  const [{ data: memberships }, { data: assignments }] = await Promise.all([
    supabase.from("field_team_members").select("team_id, person:people(*)"),
    supabase.from("event_team_assignments").select("event_id, team_id"),
  ]);
  const members = memberships ?? [];
  const eventAssignments = assignments ?? [];

  return teams.map((team) => ({
    ...team,
    members: members
      .filter((membership) => membership.team_id === team.id && membership.person)
      .map((membership) => ({
        person: membership.person as unknown as Person,
        role_on_team: (membership as { role_on_team?: string }).role_on_team ?? "member",
      })),
    event_ids: eventAssignments
      .filter((assignment) => assignment.team_id === team.id)
      .map((assignment) => assignment.event_id),
  })) as unknown as FieldTeam[];
}

export async function getEquipment(): Promise<Equipment[]> {
  if (DEMO_MODE) return demoEquipment;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("equipment")
    .select("*, unit:mobile_units(*)")
    .order("name");
  return (data ?? []) as unknown as Equipment[];
}

export async function getCheckins(eventId: string): Promise<EventCheckin[]> {
  if (DEMO_MODE) return demoCheckins.filter((c) => c.event_id === eventId);
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("event_checkins")
    .select("*, participant:participants(*)")
    .eq("event_id", eventId)
    .order("checked_in_at");
  return (data ?? []) as unknown as EventCheckin[];
}

export async function getGazeFixations(sessionId: string): Promise<GazeFixation[]> {
  if (DEMO_MODE) return demoGaze.filter((g) => g.session_id === sessionId);
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gaze_fixations")
    .select("*")
    .eq("session_id", sessionId)
    .limit(2000);
  return (data ?? []) as unknown as GazeFixation[];
}

// --------------------------------------------------------- phase 4: sponsors
export async function getSponsors(): Promise<Sponsor[]> {
  if (DEMO_MODE) return demoSponsors;
  return (await liveList<Sponsor>("sponsors", "name")) ?? [];
}

export async function getSponsorPackages(): Promise<SponsorPackage[]> {
  if (DEMO_MODE) return demoSponsorPackages;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sponsor_packages")
    .select("*, sponsor:sponsors(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as SponsorPackage[];
}

export async function getSponsorships(): Promise<EventSponsorship[]> {
  if (DEMO_MODE) return demoSponsorships;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("event_sponsorships")
    .select("*, event:events(*), package:sponsor_packages(*, sponsor:sponsors(*))")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as EventSponsorship[];
}

// ---------------------------------------------------- differentiator: mentions
export async function getBrandMentions(): Promise<BrandMention[]> {
  if (DEMO_MODE) {
    return demoBrandMentions.map((m) => ({
      ...m,
      sponsor: demoSponsors.find((s) => s.id === m.sponsor_id),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("brand_mentions")
    .select("*, sponsor:sponsors(*)")
    .order("occurred_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as unknown as BrandMention[];
}

// --------------------------------------------------- differentiator: mechanics
export interface MechanicInsight {
  mechanic_id: string;
  mechanic: string;
  sessions: number;
  engagement: number | null;
  reaction_ms: number | null;
  persistence: number | null;
  games: string[];
}

interface GameMechanicLink {
  game_id: string;
  mechanic_ids: string[];
}

async function fetchGameMechanicLinks(): Promise<GameMechanicLink[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("game_game_mechanics").select("game_id, mechanic_id");
  const rows = (data ?? []) as Array<{ game_id: string; mechanic_id: string }>;
  const out: GameMechanicLink[] = [];
  for (const r of rows) {
    const rec = out.find((x) => x.game_id === r.game_id);
    if (rec) rec.mechanic_ids.push(r.mechanic_id);
    else out.push({ game_id: r.game_id, mechanic_ids: [r.mechanic_id] });
  }
  return out;
}

async function getRawSessionMetrics(): Promise<SessionMetric[]> {
  if (DEMO_MODE) return demoMetrics;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("session_metrics").select("*");
  return (data ?? []) as unknown as SessionMetric[];
}

export async function getMechanicInsights(): Promise<MechanicInsight[]> {
  const [sessions, metrics, mechanics, demoLinks] = await Promise.all([
    getSessions(), getRawSessionMetrics(), getMechanics(),
    Promise.resolve(demoGameMechanics),
  ]);
  const links: GameMechanicLink[] = DEMO_MODE
    ? demoLinks.reduce<GameMechanicLink[]>((acc, gm) => {
        const rec = acc.find((x) => x.game_id === gm.game_id);
        if (rec) rec.mechanic_ids.push(gm.mechanic_id);
        else acc.push({ game_id: gm.game_id, mechanic_ids: [gm.mechanic_id] });
        return acc;
      }, [])
    : await fetchGameMechanicLinks();

  // Roll raw metric rows up per session.
  const perSession: Record<string, { eng: number[]; rt: number[]; per: number[] }> = {};
  for (const m of metrics) {
    const t = (perSession[m.session_id] ??= { eng: [], rt: [], per: [] });
    if (m.metric_key === "engagement_score") t.eng.push(m.metric_value);
    else if (m.metric_key === "reaction_time_ms") t.rt.push(m.metric_value);
    else if (m.metric_key === "persistence_events") t.per.push(m.metric_value);
  }

  const mean = (xs: number[]) =>
    xs.length === 0 ? null : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;

  interface Agg { sessions: number; eng: number[]; rt: number[]; per: number[]; games: Set<string> }
  const byMechanic = new Map<string, Agg>();
  for (const s of sessions) {
    const link = links.find((l) => l.game_id === s.game_id);
    if (!link) continue;
    const agg = perSession[s.id] ?? { eng: [], rt: [], per: [] };
    for (const mechanic_id of link.mechanic_ids) {
      let rec = byMechanic.get(mechanic_id);
      if (!rec) {
        rec = { sessions: 0, eng: [], rt: [], per: [], games: new Set<string>() };
        byMechanic.set(mechanic_id, rec);
      }
      rec.sessions += 1;
      rec.eng.push(...agg.eng);
      rec.rt.push(...agg.rt);
      rec.per.push(...agg.per);
      if (s.game) rec.games.add(s.game.title);
    }
  }

  return [...byMechanic.entries()]
    .map(([mechanic_id, r]) => ({
      mechanic_id,
      mechanic: mechanics.find((m) => m.id === mechanic_id)?.name ?? mechanic_id,
      sessions: r.sessions,
      engagement: mean(r.eng),
      reaction_ms: mean(r.rt),
      persistence: mean(r.per),
      games: [...r.games],
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

// ------------------------------------------------------ differentiator: quality
export interface QualityFinding {
  key: string;
  title: string;
  detail: string;
  affected: string[]; // session ids or participant codes
}

export interface QualityReport {
  score: number;
  label: string;
  tone: "green" | "amber" | "red";
  findings: QualityFinding[];
  checks: Array<{ label: string; passed: boolean; affected: number }>;
}

export interface RawSurveyResponse {
  session_id: string;
  question_id: string;
  response_value: unknown;
  answered_at: string;
}

async function getRawSurveyResponses(): Promise<RawSurveyResponse[]> {
  if (DEMO_MODE) return demoResponses;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("survey_responses")
    .select("session_id, question_id, response_value, answered_at");
  return (data ?? []) as RawSurveyResponse[];
}

// ------------------------------------------------- differentiator: exports
/** Everything needed for the de-identified per-study CSV export. */
export async function getStudyExportData(studyId: string) {
  const [studies, sessions, surveys, rawResponses] = await Promise.all([
    getStudies(), getSessions(), getSurveys(), getRawSurveyResponses(),
  ]);
  const study = studies.find((s) => s.id === studyId) ?? null;
  const studySessions = sessions.filter((s) => s.study_id === studyId);
  const survey = surveys.find((v) => v.study_id === studyId) ?? null;
  const questions = survey
    ? (await getQuestions(survey.id)).slice(0, survey.question_limit)
    : [];
  const questionIds = new Set(questions.map((q) => q.id));
  const sessionIds = new Set(studySessions.map((s) => s.id));
  const responses = rawResponses.filter(
    (r) => sessionIds.has(r.session_id) && questionIds.has(r.question_id),
  );
  return { study, sessions: studySessions, survey, questions, responses };
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function getQualityReport(): Promise<QualityReport> {
  const [sessions, participants, responses, metrics] = await Promise.all([
    getSessions(), getParticipants(), getRawSurveyResponses(), getRawSessionMetrics(),
  ]);

  const findings: QualityFinding[] = [];
  const checks: QualityReport["checks"] = [];
  let score = 100;

  // 1. Straightlining — a session whose answers are ≥80% identical.
  const bySession = new Map<string, unknown[]>();
  for (const r of responses) {
    const arr = bySession.get(r.session_id);
    if (arr) arr.push(r.response_value);
    else bySession.set(r.session_id, [r.response_value]);
  }
  const flatliners: string[] = [];
  for (const [sessionId, values] of bySession) {
    if (values.length < 5) continue;
    const counts = new Map<string, number>();
    for (const v of values) {
      const k = typeof v === "object" && v !== null ? "text" : String(v);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = Math.max(...counts.values());
    if (top / values.length >= 0.8) flatliners.push(sessionId);
  }
  checks.push({ label: "No straightlined surveys", passed: flatliners.length === 0, affected: flatliners.length });
  if (flatliners.length > 0) {
    score -= flatliners.length * 5;
    findings.push({
      key: "straightlining",
      title: "Straightlined responses",
      detail: `${flatliners.length} session(s) gave the same answer to 80%+ of scale questions — likely disengaged or fraudulent completion.`,
      affected: flatliners,
    });
  }

  // 2. Duplicate participant codes.
  const codeCounts = new Map<string, number>();
  for (const p of participants) codeCounts.set(p.code, (codeCounts.get(p.code) ?? 0) + 1);
  const dupCodes = [...codeCounts.entries()].filter(([, n]) => n > 1).map(([c]) => c);
  const dupAffected = participants.filter((p) => dupCodes.includes(p.code)).map((p) => p.code);
  checks.push({ label: "No duplicate participant codes", passed: dupCodes.length === 0, affected: dupAffected.length });
  if (dupCodes.length > 0) {
    score -= dupCodes.length * 4;
    findings.push({
      key: "duplicate_codes",
      title: "Duplicate participant codes",
      detail: `${dupCodes.length} code(s) are registered more than once, which breaks per-participant analysis.`,
      affected: [...new Set(dupAffected)],
    });
  }

  // 3. Missing consent records.
  const noConsent = participants.filter((p) => !p.consent_given).map((p) => p.code);
  checks.push({ label: "All participants have consent", passed: noConsent.length === 0, affected: noConsent.length });
  if (noConsent.length > 0) {
    score -= noConsent.length * 8;
    findings.push({
      key: "consent_gaps",
      title: "Missing consent records",
      detail: `${noConsent.length} participant(s) have no consent on file. Their data cannot be used in reporting until consent is recorded.`,
      affected: noConsent,
    });
  }

  // 4. Duration outliers — sessions far from the median length.
  const timed = sessions.filter((s) => typeof s.duration_minutes === "number");
  const med = median(timed.map((s) => s.duration_minutes as number));
  const outliers = timed
    .filter((s) => (s.duration_minutes as number) > med * 1.6 || (s.duration_minutes as number) < med * 0.4)
    .map((s) => s.id);
  checks.push({ label: "Session durations plausible", passed: outliers.length === 0, affected: outliers.length });
  if (outliers.length > 0) {
    score -= outliers.length * 3;
    findings.push({
      key: "duration_outliers",
      title: "Duration outliers",
      detail: `${outliers.length} session(s) ran under 40% or over 160% of the median length (${Math.round(med)} min). Verify logs before trusting their metrics.`,
      affected: outliers,
    });
  }

  // 5. Sessions with no captured metrics.
  const withMetrics = new Set(metrics.map((m) => m.session_id));
  const noMetrics = sessions.filter((s) => !withMetrics.has(s.id)).map((s) => s.id);
  checks.push({ label: "All sessions have metrics", passed: noMetrics.length === 0, affected: noMetrics.length });
  if (noMetrics.length > 0) {
    score -= noMetrics.length * 5;
    findings.push({
      key: "missing_metrics",
      title: "Sessions missing metrics",
      detail: `${noMetrics.length} session(s) completed with no engagement/reaction metrics captured.`,
      affected: noMetrics,
    });
  }

  score = Math.max(0, Math.min(100, score));
  const label = score >= 90 ? "High confidence" : score >= 70 ? "Review recommended" : "Needs attention";
  const tone: QualityReport["tone"] = score >= 90 ? "green" : score >= 70 ? "amber" : "red";

  return { score, label, tone, findings, checks };
}

// ------------------------------------------------- institutional + content
export function getGrants(): Promise<Grant[]> {
  if (DEMO_MODE) return Promise.resolve(demoGrants);
  return liveList<Grant>("grants", "created_at");
}

export async function getPrograms(): Promise<InstitutionalProgram[]> {
  if (DEMO_MODE) {
    return demoPrograms.map((p) => ({
      ...p,
      partner_org: demoOrganizations.find((o) => o.id === p.partner_org_id),
      site_location: demoLocations.find((l) => l.id === p.site_location_id),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("institutional_programs")
    .select("*, partner_org:organizations(*), site_location:locations(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as InstitutionalProgram[];
}

export async function getContentItems(): Promise<ContentItem[]> {
  if (DEMO_MODE) {
    return demoContentItems.map((c) => ({
      ...c,
      author: demoPeople.find((p) => p.id === c.author_person_id),
      study: demoStudies.find((s) => s.id === c.study_id),
      game: demoGames.find((g) => g.id === c.game_id),
    }));
  }
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("content_items")
    .select("*, author:people(*), study:studies(*), game:games(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ContentItem[];
}

// ------------------------------------------------------------------ helpers
async function liveList<T>(table: string, order: string): Promise<T[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from(table).select("*").order(order);
  return (data ?? []) as T[];
}

async function liveAudit(): Promise<AuditEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("audit_log").select("id, occurred_at, actor_id, table_name, record_id, action")
    .order("id", { ascending: false }).limit(100);
  return (data ?? []) as AuditEntry[];
}
