-- ============================================================================
-- GAMESPEXS CORE SCHEMA — V1 (Phases 1–2 of the Master Blueprint)
-- ----------------------------------------------------------------------------
-- Data model covers:
--   Foundation   : organizations, profiles (roles), locations, people, audit
--   Game Library : game_categories, games, game_mechanics, game_game_mechanics
--   Research     : studies, participants, research_sessions, surveys,
--                  survey_questions, survey_responses, session_metrics,
--                  research_findings, research_reports
--
-- Blueprint constraints enforced here:
--   * Surveys are capped at 15 questions (DB trigger).
--   * Survey estimated duration must be 10–12 minutes (DB constraint).
--   * Every mutation to core tables is captured in the audit log (trigger).
--   * Row Level Security is enabled on all tables.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. FOUNDATION
-- ============================================================================

-- Organizations: the company itself, research partners, sponsors, agencies.
create table public.organizations (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    slug        text not null unique,
    org_type    text not null default 'internal'
                check (org_type in ('internal','research_partner','sponsor','government_agency','corrections','other')),
    website     text,
    notes       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Application profiles, linked 1:1 to auth.users.
create table public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    email        text not null,
    full_name    text,
    role         text not null default 'researcher'
                 check (role in ('admin','executive','researcher','field_operator','judge','storefront','sponsor_manager','viewer')),
    is_active    boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Application users. Roles gate module access. Linked to auth.users.';

-- Locations: storefront, mobile-unit stops, institutional sites, event venues.
create table public.locations (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    name           text not null,
    location_type  text not null default 'venue'
                   check (location_type in ('storefront','venue','mobile_stop','institutional','research_lab','other')),
    address_line1  text,
    city           text,
    state          text,
    postal_code    text,
    county         text,
    latitude       numeric(9,6),
    longitude      numeric(9,6),
    is_active      boolean not null default true,
    notes          text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index locations_org_idx on public.locations(organization_id);
create index locations_city_idx on public.locations(city);

-- People: employees, contractors, researchers, interviewers, judges,
-- community workers ("Local Heroes"), and institutional contacts.
create table public.people (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    full_name      text not null,
    email          text,
    phone          text,
    person_type    text not null default 'employee'
                   check (person_type in ('employee','contractor','researcher','interviewer','judge','community_worker','institutional_contact','volunteer')),
    primary_location_id uuid references public.locations(id) on delete set null,
    is_active      boolean not null default true,
    notes          text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index people_type_idx on public.people(person_type);
create index people_org_idx on public.people(organization_id);

-- ============================================================================
-- 2. GAME LIBRARY
-- ============================================================================

create table public.game_categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    description text,
    created_at  timestamptz not null default now()
);

-- Seed the blueprint's game families.
insert into public.game_categories (name, description) values
    ('Video Games',  'Digital and closed-network game titles'),
    ('Board Games',  'Tabletop board games'),
    ('Card Games',   'Playing-card and trading-card games'),
    ('Paper Games',  'Pencil-and-paper games, puzzles, mazes'),
    ('Sports / Team Games', 'Physical and team-based games'),
    ('Odd Games',    'Novel, experimental, and unusual games');

create table public.games (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    category_id     uuid not null references public.game_categories(id) on delete restrict,
    publisher       text,
    year_released   integer check (year_released between 1950 and 2100),
    min_players     integer not null default 1 check (min_players >= 1),
    max_players     integer not null default 4 check (max_players >= min_players),
    play_minutes    integer,
    complexity      text not null default 'medium'
                    check (complexity in ('low','medium','high')),
    is_closed_network boolean not null default false,
    description     text,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index games_category_idx on public.games(category_id);

create table public.game_mechanics (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    description text,
    created_at  timestamptz not null default now()
);

-- Many-to-many: which mechanics a game exercises (research relevance).
create table public.game_game_mechanics (
    game_id      uuid not null references public.games(id) on delete cascade,
    mechanic_id  uuid not null references public.game_mechanics(id) on delete cascade,
    primary key (game_id, mechanic_id)
);

-- ============================================================================
-- 3. RESEARCH ENGINE
-- ============================================================================

create table public.studies (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    code           text not null unique,
    title          text not null,
    research_question text,
    status         text not null default 'draft'
                   check (status in ('draft','active','paused','complete','archived')),
    starts_on      date,
    ends_on        date,
    lead_person_id uuid references public.people(id) on delete set null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index studies_status_idx on public.studies(status);

create table public.participants (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    code           text not null unique,
    display_name   text,
    email          text,
    birth_year     integer,
    gender         text,
    city           text,
    county         text,
    state          text,
    consent_given  boolean not null default false,
    consent_at     timestamptz,
    is_institutional boolean not null default false,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index participants_city_idx on public.participants(city);

-- A research session = one participant playing one game in one study context.
create table public.research_sessions (
    id               uuid primary key default gen_random_uuid(),
    study_id         uuid not null references public.studies(id) on delete cascade,
    participant_id   uuid not null references public.participants(id) on delete restrict,
    game_id          uuid not null references public.games(id) on delete restrict,
    location_id      uuid references public.locations(id) on delete set null,
    session_date     timestamptz not null default now(),
    duration_minutes integer check (duration_minutes between 1 and 480),
    interviewer_id   uuid references public.people(id) on delete set null,
    channel          text not null default 'storefront'
                     check (channel in ('storefront','mobile_unit','event','institutional','remote')),
    status           text not null default 'scheduled'
                     check (status in ('scheduled','in_progress','complete','void')),
    notes            text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create index sessions_study_idx     on public.research_sessions(study_id);
create index sessions_participant_idx on public.research_sessions(participant_id);
create index sessions_game_idx      on public.research_sessions(game_id);

-- Surveys: 15-question cap and 10–12 minute target enforced by DB.
create table public.surveys (
    id               uuid primary key default gen_random_uuid(),
    study_id         uuid references public.studies(id) on delete cascade,
    title            text not null,
    description      text,
    estimated_minutes integer not null default 10
                     check (estimated_minutes between 10 and 12),
    question_limit   integer not null default 15,
    status           text not null default 'draft'
                     check (status in ('draft','active','retired')),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create table public.survey_questions (
    id          uuid primary key default gen_random_uuid(),
    survey_id   uuid not null references public.surveys(id) on delete cascade,
    ordinal     integer not null check (ordinal between 1 and 15),
    prompt      text not null,
    question_type text not null default 'likert_5'
                check (question_type in ('likert_5','multiple_choice','free_text','boolean','rating_10','ranking')),
    options     jsonb not null default '[]'::jsonb,
    required    boolean not null default true,
    created_at  timestamptz not null default now(),
    unique (survey_id, ordinal)
);

-- Enforce the blueprint's 15-question cap on insert AND update.
create or replace function public.enforce_survey_question_cap()
returns trigger as $$
declare
    n integer;
begin
    select count(*) into n from public.survey_questions where survey_id = new.survey_id;
    if n > 15 then
        raise exception 'Surveys are capped at 15 questions (GAMESPEXS blueprint constraint).';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trg_survey_question_cap
    after insert or update on public.survey_questions
    for each row execute function public.enforce_survey_question_cap();

-- Responses: one row per question answered in a session's survey run.
create table public.survey_responses (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null references public.research_sessions(id) on delete cascade,
    question_id  uuid not null references public.survey_questions(id) on delete restrict,
    response_value jsonb not null,
    answered_at  timestamptz not null default now(),
    unique (session_id, question_id)
);

create index responses_session_idx on public.survey_responses(session_id);

-- Behavioral / sensor metrics captured during play (incl. eye-tracking input).
create table public.session_metrics (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null references public.research_sessions(id) on delete cascade,
    metric_key   text not null,
    metric_value numeric not null,
    unit         text,
    captured_at  timestamptz not null default now(),
    source       text not null default 'manual'
                 check (source in ('manual','sensor','eye_tracker','screen_recorder','game_log'))
);

create index metrics_session_idx on public.session_metrics(session_id);
create index metrics_key_idx     on public.session_metrics(metric_key);

comment on table public.session_metrics is 'Time-series behavioral metrics per session: gaze fixations, reaction time, engagement scores, heatmap aggregates.';

create table public.research_findings (
    id           uuid primary key default gen_random_uuid(),
    study_id     uuid not null references public.studies(id) on delete cascade,
    title        text not null,
    summary      text,
    evidence     jsonb not null default '[]'::jsonb,
    confidence   text not null default 'preliminary'
                 check (confidence in ('preliminary','supported','confirmed')),
    created_at   timestamptz not null default now()
);

create table public.research_reports (
    id           uuid primary key default gen_random_uuid(),
    study_id     uuid not null references public.studies(id) on delete cascade,
    title        text not null,
    body_md      text,
    status       text not null default 'draft'
                 check (status in ('draft','review','published')),
    published_at timestamptz,
    created_at   timestamptz not null default now()
);

-- ============================================================================
-- 4. AUDIT LOG
-- ============================================================================

create table public.audit_log (
    id          bigserial primary key,
    occurred_at timestamptz not null default now(),
    actor_id    uuid,
    table_name  text not null,
    record_id   text,
    action      text not null check (action in ('INSERT','UPDATE','DELETE')),
    changes     jsonb
);

create index audit_log_table_idx  on public.audit_log(table_name, occurred_at);
create index audit_log_actor_idx  on public.audit_log(actor_id);

create or replace function public.audit_row()
returns trigger as $$
declare
    actor uuid := auth.uid();
    rec   jsonb;
begin
    rec := to_jsonb(coalesce(new, old));
    insert into public.audit_log (actor_id, table_name, record_id, action, changes)
    values (
        actor,
        tg_table_name,
        (rec ->> 'id'),
        tg_op,
        case tg_op
            when 'DELETE' then to_jsonb(old)
            else jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old))
        end
    );
    return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Attach the audit trigger to every core table.
do $$
declare t text;
begin
    foreach t in array array[
        'organizations','profiles','locations','people',
        'game_categories','games','game_mechanics','game_game_mechanics',
        'studies','participants','research_sessions','surveys',
        'survey_questions','survey_responses','session_metrics',
        'research_findings','research_reports'
    ]
    loop
        execute format('create trigger trg_audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row();', t, t);
    end loop;
end $$;

-- ============================================================================
-- 5. updated_at maintenance + RLS
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
    foreach t in array array[
        'organizations','profiles','locations','people','games',
        'studies','participants','research_sessions','surveys'
    ]
    loop
        execute format('create trigger trg_touch_%I before update on public.%I for each row execute function public.touch_updated_at();', t, t);
    end loop;
end $$;

alter table public.organizations       enable row level security;
alter table public.profiles            enable row level security;
alter table public.locations           enable row level security;
alter table public.people              enable row level security;
alter table public.game_categories     enable row level security;
alter table public.games               enable row level security;
alter table public.game_mechanics      enable row level security;
alter table public.game_game_mechanics enable row level security;
alter table public.studies             enable row level security;
alter table public.participants        enable row level security;
alter table public.research_sessions   enable row level security;
alter table public.surveys             enable row level security;
alter table public.survey_questions    enable row level security;
alter table public.survey_responses    enable row level security;
alter table public.session_metrics     enable row level security;
alter table public.research_findings   enable row level security;
alter table public.research_reports    enable row level security;
alter table public.audit_log           enable row level security;

-- Authenticated users can read foundation + library tables.
create policy "auth read organizations" on public.organizations
    for select to authenticated using (true);
create policy "auth read locations" on public.locations
    for all to authenticated using (true) with check (true);
create policy "auth read people" on public.people
    for all to authenticated using (true) with check (true);
create policy "auth read game_categories" on public.game_categories
    for select to authenticated using (true);
create policy "auth write games" on public.games
    for all to authenticated using (true) with check (true);
create policy "auth read game_mechanics" on public.game_mechanics
    for select to authenticated using (true);
create policy "auth write game_game_mechanics" on public.game_game_mechanics
    for all to authenticated using (true) with check (true);
create policy "auth write studies" on public.studies
    for all to authenticated using (true) with check (true);
create policy "auth write participants" on public.participants
    for all to authenticated using (true) with check (true);
create policy "auth write sessions" on public.research_sessions
    for all to authenticated using (true) with check (true);
create policy "auth write surveys" on public.surveys
    for all to authenticated using (true) with check (true);
create policy "auth write questions" on public.survey_questions
    for all to authenticated using (true) with check (true);
create policy "auth write responses" on public.survey_responses
    for all to authenticated using (true) with check (true);
create policy "auth write metrics" on public.session_metrics
    for all to authenticated using (true) with check (true);
create policy "auth write findings" on public.research_findings
    for all to authenticated using (true) with check (true);
create policy "auth write reports" on public.research_reports
    for all to authenticated using (true) with check (true);
create policy "auth read audit" on public.audit_log
    for select to authenticated using (true);

-- Profiles: users read their own; admins read all (V1 simplification:
-- full org-scoped policies arrive with Phase 2 hardening).
create policy "profiles self read" on public.profiles
    for select to authenticated using (id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "profiles self update" on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================================
-- 6. DASHBOARD SUPPORT: metrics RPC
-- ============================================================================

create or replace function public.dashboard_stats()
returns json as $$
declare
    result json;
begin
    select json_build_object(
        'active_studies',      (select count(*) from public.studies where status = 'active'),
        'total_participants',  (select count(*) from public.participants),
        'sessions_this_month', (select count(*) from public.research_sessions
                                where session_date >= date_trunc('month', now())),
        'sessions_total',      (select count(*) from public.research_sessions),
        'games_tracked',       (select count(*) from public.games where is_active),
        'responses_captured',  (select count(*) from public.survey_responses),
        'metrics_captured',    (select count(*) from public.session_metrics),
        'people_count',        (select count(*) from public.people where is_active),
        'locations_count',     (select count(*) from public.locations where is_active)
    )
    into result;
    return result;
end;
$$ language plpgsql security definer;
