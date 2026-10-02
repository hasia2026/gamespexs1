// ============================================================================
// GAMESPEXS domain types — mirror of the Supabase schema (0001_gamespexs_core)
// ============================================================================

export type Role =
  | "admin"
  | "executive"
  | "researcher"
  | "field_operator"
  | "judge"
  | "storefront"
  | "sponsor_manager"
  | "viewer";

export type Channel =
  | "storefront"
  | "mobile_unit"
  | "event"
  | "institutional"
  | "remote";

export type StudyStatus = "draft" | "active" | "paused" | "complete" | "archived";

export type SessionStatus = "scheduled" | "in_progress" | "complete" | "void";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  website: string | null;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
}

export interface Location {
  id: string;
  organization_id: string | null;
  name: string;
  location_type: string;
  city: string | null;
  state: string | null;
  county: string | null;
  is_active: boolean;
  address_line1?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface Person {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  person_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  primary_location_id?: string | null;
  notes?: string | null;
}

export interface GameCategory {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}

export interface Game {
  id: string;
  title: string;
  category_id: string;
  publisher: string | null;
  year_released: number | null;
  min_players: number;
  max_players: number;
  play_minutes: number | null;
  complexity: "low" | "medium" | "high";
  is_closed_network: boolean;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  category?: GameCategory;
  mechanics?: GameMechanic[];
}

export interface GameMechanic {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}

export interface Study {
  id: string;
  organization_id: string | null;
  code: string;
  title: string;
  research_question: string | null;
  status: StudyStatus;
  starts_on: string | null;
  ends_on: string | null;
  lead_person_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  organization_id: string | null;
  code: string;
  display_name: string | null;
  birth_year: number | null;
  gender: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  consent_given: boolean;
  consent_at?: string | null;
  is_institutional: boolean;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchSession {
  id: string;
  study_id: string;
  participant_id: string;
  game_id: string;
  location_id: string | null;
  session_date: string;
  duration_minutes: number | null;
  interviewer_id: string | null;
  channel: Channel;
  status: SessionStatus;
  study?: Study;
  participant?: Participant;
  game?: Game;
  location?: Location;
  interviewer?: Person;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Survey {
  id: string;
  study_id: string | null;
  title: string;
  description: string | null;
  estimated_minutes: number;
  question_limit: number;
  status: "draft" | "active" | "retired";
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  ordinal: number;
  prompt: string;
  question_type: "likert_5" | "multiple_choice" | "free_text" | "boolean" | "rating_10" | "ranking";
  options: unknown[];
  required: boolean;
  quadrant?: string | null;
}

export interface SurveyResponse {
  id: string;
  session_id: string;
  question_id: string;
  response_value: unknown;
  answered_at: string;
}

export interface SessionMetric {
  id: string;
  session_id: string;
  metric_key: string;
  metric_value: number;
  unit: string | null;
  captured_at: string;
  source: string;
}

export interface ResearchFinding {
  id: string;
  study_id: string;
  title: string;
  summary: string | null;
  confidence: "preliminary" | "supported" | "confirmed";
  created_at: string;
}

export interface ResearchReport {
  id: string;
  study_id: string;
  title: string;
  body_md: string | null;
  status: "draft" | "review" | "published";
  published_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
}

// ---------------------------------------------------------------- Phase 3
export interface MobileUnit {
  id: string;
  organization_id?: string | null;
  name: string;
  call_sign: string | null;
  make_model: string | null;
  status: "active" | "maintenance" | "retired";
}

export interface RouteStop {
  id: string;
  route_id: string;
  location_id: string;
  stop_order: number;
  arrive_at: string | null;
  depart_at: string | null;
}

export interface Route {
  id: string;
  mobile_unit_id: string;
  name: string;
  route_date: string;
  status: "planned" | "in_progress" | "complete" | "cancelled";
  unit?: MobileUnit;
  stops?: RouteStop[];
  organization_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface GsxEvent {
  id: string;
  code: string;
  title: string;
  event_type: "community" | "institutional" | "storefront" | "sponsor_activation" | "research";
  status: "planned" | "active" | "complete" | "cancelled";
  starts_at: string;
  ends_at: string | null;
  location_id: string | null;
  study_id: string | null;
  expected_attendance: number | null;
  organization_id?: string | null;
  route_id?: string | null;
  notes?: string | null;
  created_at?: string;
  location?: Location | null;
  study?: Study | null;
}

export interface FieldTeam {
  id: string;
  name: string;
  members?: Array<{ person: Person; role_on_team: string }>;
  organization_id?: string | null;
  notes?: string | null;
  created_at?: string;
  event_ids?: string[];
}

export interface Equipment {
  id: string;
  organization_id?: string | null;
  name: string;
  equipment_type: string;
  serial_number: string | null;
  status: "ready" | "in_use" | "maintenance" | "lost" | "retired";
  assigned_unit_id: string | null;
  assigned_event_id?: string | null;
  notes?: string | null;
  created_at?: string;
  unit?: MobileUnit | null;
}

export interface EventCheckin {
  id: string;
  event_id: string;
  participant_id: string;
  checked_in_at: string;
  method: string;
  participant?: Participant;
}

export interface GazeFixation {
  id: string;
  session_id: string;
  x: number;
  y: number;
  duration_ms: number;
  captured_at: string;
}

// ---------------------------------------------------------------- Phase 4
export interface Sponsor {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  contact_name: string | null;
  contact_email: string | null;
  is_prize_partner: boolean;
  organization_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface SponsorPackage {
  id: string;
  sponsor_id: string;
  name: string;
  ad_slots: number;
  price_cents: number;
  period_start: string | null;
  period_end: string | null;
  sponsor?: Sponsor;
  created_at?: string;
}

export interface EventSponsorship {
  id: string;
  event_id: string;
  package_id: string;
  fee_cents: number;
  event?: GsxEvent;
  package?: SponsorPackage;
  created_at?: string;
}

export type MentionSource =
  | "survey_response"
  | "session_note"
  | "event_announcement"
  | "manual";

export interface BrandMention {
  id: string;
  sponsor_id: string;
  source: MentionSource;
  context_ref: string | null;
  phrase: string;
  occurred_at: string;
  sponsor?: Sponsor;
  created_at?: string;
}

// ---------------------------------------------------------------- Phase 6/5
export interface Grant {
  id: string;
  funder: string;
  agency_type: "government" | "foundation" | "corporate" | "university" | "other";
  title: string;
  program_area: string | null;
  amount_cents: number;
  status: "prospect" | "submitted" | "awarded" | "completed" | "declined";
  starts_on: string | null;
  ends_on: string | null;
  study_id: string | null;
  notes: string | null;
}

export interface InstitutionalProgram {
  id: string;
  partner_org_id: string | null;
  program_type: "corrections" | "government_agency" | "research_partner" | "education" | "other";
  title: string;
  description: string | null;
  status: "planning" | "active" | "paused" | "complete";
  site_location_id: string | null;
  is_closed_network: boolean;
  consent_protocol_notes: string | null;
  starts_on: string | null;
  ends_on: string | null;
  partner_org?: Organization;
  site_location?: Location;
}

export interface ContentItem {
  id: string;
  title: string;
  content_type: "article" | "video" | "photo" | "game_guide" | "press" | "other";
  status: "draft" | "review" | "published";
  body_md: string | null;
  media_url: string | null;
  author_person_id: string | null;
  study_id: string | null;
  game_id: string | null;
  published_at: string | null;
  author?: Person;
  study?: Study;
  game?: Game;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  website: string | null;
}

export interface DashboardStats {
  active_studies: number;
  total_participants: number;
  sessions_this_month: number;
  sessions_total: number;
  games_tracked: number;
  responses_captured: number;
  metrics_captured: number;
  people_count: number;
  locations_count: number;
}
