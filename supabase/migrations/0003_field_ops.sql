-- ============================================================================
-- GAMESPEXS PHASE 3 — FIELD OPERATIONS + GAZE DATA (+ sponsor foundations)
-- Run after 0001_gamespexs_core.sql and 0002_seed.sql
-- ============================================================================

-- Mobile game units: the fleet -------------------------------------------------
create table public.mobile_units (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    name           text not null,
    call_sign      text,
    make_model     text,
    status         text not null default 'active'
                   check (status in ('active','maintenance','retired')),
    home_location_id uuid references public.locations(id) on delete set null,
    notes          text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Routes: a day of scheduled stops ----------------------------------------------
create table public.routes (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    mobile_unit_id uuid not null references public.mobile_units(id) on delete cascade,
    name           text not null,
    route_date     date not null,
    status         text not null default 'planned'
                   check (status in ('planned','in_progress','complete','cancelled')),
    notes          text,
    created_at     timestamptz not null default now()
);

-- Ordered stops on a route -------------------------------------------------------
create table public.route_stops (
    id             uuid primary key default gen_random_uuid(),
    route_id       uuid not null references public.routes(id) on delete cascade,
    location_id    uuid not null references public.locations(id) on delete cascade,
    stop_order     integer not null check (stop_order >= 1),
    arrive_at      time,
    depart_at      time,
    unique (route_id, stop_order)
);

-- Events: community, institutional, and storefront events ------------------------
create table public.events (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    code           text not null unique,
    title          text not null,
    event_type     text not null default 'community'
                   check (event_type in ('community','institutional','storefront','sponsor_activation','research')),
    status         text not null default 'planned'
                   check (status in ('planned','active','complete','cancelled')),
    starts_at      timestamptz not null,
    ends_at        timestamptz,
    location_id    uuid references public.locations(id) on delete set null,
    route_id       uuid references public.routes(id) on delete set null,
    study_id       uuid references public.studies(id) on delete set null,
    expected_attendance integer,
    notes          text,
    created_at     timestamptz not null default now()
);

create index events_starts_idx on public.events(starts_at);

-- Field teams --------------------------------------------------------------------
create table public.field_teams (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    name           text not null,
    notes          text,
    created_at     timestamptz not null default now()
);

create table public.field_team_members (
    team_id        uuid not null references public.field_teams(id) on delete cascade,
    person_id      uuid not null references public.people(id) on delete cascade,
    role_on_team   text not null default 'member'
                   check (role_on_team in ('lead','interviewer','judge','driver','member')),
    primary key (team_id, person_id)
);

-- Team assignment to events ------------------------------------------------------
create table public.event_team_assignments (
    event_id       uuid not null references public.events(id) on delete cascade,
    team_id        uuid not null references public.field_teams(id) on delete cascade,
    primary key (event_id, team_id)
);

-- Equipment inventory -------------------------------------------------------------
create table public.equipment (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    name           text not null,
    equipment_type text not null default 'console'
                   check (equipment_type in ('console','eye_tracker','display','vr_headset','tablet','vehicle_rack','survey_station','other')),
    serial_number  text,
    status         text not null default 'ready'
                   check (status in ('ready','in_use','maintenance','lost','retired')),
    assigned_unit_id uuid references public.mobile_units(id) on delete set null,
    assigned_event_id uuid references public.events(id) on delete set null,
    notes          text,
    created_at     timestamptz not null default now()
);

-- Event check-ins: participants arriving at events ---------------------------------
create table public.event_checkins (
    id             uuid primary key default gen_random_uuid(),
    event_id       uuid not null references public.events(id) on delete cascade,
    participant_id uuid not null references public.participants(id) on delete cascade,
    checked_in_at  timestamptz not null default now(),
    method         text not null default 'qr'
                   check (method in ('qr','manual','roster')),
    unique (event_id, participant_id)
);

-- Gaze fixations: raw eye-tracking samples for heatmap visualization ---------------
create table public.gaze_fixations (
    id             uuid primary key default gen_random_uuid(),
    session_id     uuid not null references public.research_sessions(id) on delete cascade,
    x              numeric(5,2) not null check (x between 0 and 100),
    y              numeric(5,2) not null check (y between 0 and 100),
    duration_ms    integer not null check (duration_ms > 0),
    captured_at    timestamptz not null default now()
);

create index gaze_session_idx on public.gaze_fixations(session_id);

comment on table public.gaze_fixations is 'Normalized screen-space fixations (0-100 percent coordinates) captured by the eye tracker; renders as heatmaps.';

-- Sponsor foundations (Phase 4 tables early, since reports reference them) ----------
create table public.sponsors (
    id             uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete set null,
    name           text not null,
    tier           text not null default 'bronze'
                   check (tier in ('bronze','silver','gold','platinum')),
    contact_name   text,
    contact_email  text,
    is_prize_partner boolean not null default false,
    notes          text,
    created_at     timestamptz not null default now()
);

create table public.sponsor_packages (
    id             uuid primary key default gen_random_uuid(),
    sponsor_id     uuid not null references public.sponsors(id) on delete cascade,
    name           text not null,
    ad_slots       integer not null default 1,
    price_cents    integer not null default 0,
    period_start   date,
    period_end     date,
    created_at     timestamptz not null default now()
);

create table public.event_sponsorships (
    id             uuid primary key default gen_random_uuid(),
    event_id       uuid not null references public.events(id) on delete cascade,
    package_id     uuid not null references public.sponsor_packages(id) on delete cascade,
    fee_cents      integer not null default 0,
    created_at     timestamptz not null default now()
);

-- RLS ------------------------------------------------------------------------------
do $$
declare t text;
begin
    foreach t in array array[
        'mobile_units','routes','route_stops','events','field_teams',
        'field_team_members','event_team_assignments','equipment',
        'event_checkins','gaze_fixations','sponsors','sponsor_packages',
        'event_sponsorships'
    ]
    loop
        execute format('alter table public.%I enable row level security;', t);
        execute format('create policy "auth all %I" on public.%I for all to authenticated using (true) with check (true);', t, t);
    end loop;
end $$;

-- Audit triggers --------------------------------------------------------------------
create or replace function public.audit_row() returns trigger as $$
declare
    actor uuid := auth.uid();
    rec   jsonb;
begin
    rec := to_jsonb(coalesce(new, old));
    insert into public.audit_log (actor_id, table_name, record_id, action, changes)
    values (actor, tg_table_name, (rec ->> 'id'), tg_op,
        case tg_op when 'DELETE' then to_jsonb(old)
        else jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old)) end);
    return coalesce(new, old);
end;
$$ language plpgsql security definer;

do $$
declare t text;
begin
    foreach t in array array[
        'mobile_units','routes','events','field_teams','equipment',
        'event_checkins','gaze_fixations','sponsors','event_sponsorships'
    ]
    loop
        execute format('create trigger trg_audit2_%I after insert or update or delete on public.%I for each row execute function public.audit_row();', t, t);
    end loop;
end $$;

-- Touch updated_at on units ---------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

create trigger trg_touch_units before update on public.mobile_units
for each row execute function public.touch_updated_at();
