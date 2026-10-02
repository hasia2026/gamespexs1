-- 0009 — INSTITUTIONAL SYSTEM (grants, programs) + CONTENT SYSTEM (media library)

-- Grants: funding sources for research and operations.
create table public.grants (
    id            uuid primary key default gen_random_uuid(),
    funder        text not null,
    agency_type   text not null default 'government'
                  check (agency_type in ('government','foundation','corporate','university','other')),
    title         text not null,
    program_area  text,
    amount_cents  integer not null default 0,
    status        text not null default 'prospect'
                  check (status in ('prospect','submitted','awarded','completed','declined')),
    starts_on     date,
    ends_on       date,
    study_id      uuid references public.studies(id) on delete set null,
    notes         text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- Institutional programs: corrections, agencies, research partnerships.
create table public.institutional_programs (
    id              uuid primary key default gen_random_uuid(),
    partner_org_id  uuid references public.organizations(id) on delete set null,
    program_type    text not null default 'corrections'
                    check (program_type in ('corrections','government_agency','research_partner','education','other')),
    title           text not null,
    description     text,
    status          text not null default 'planning'
                    check (status in ('planning','active','paused','complete')),
    site_location_id uuid references public.locations(id) on delete set null,
    is_closed_network boolean not null default false,
    consent_protocol_notes text,
    starts_on       date,
    ends_on         date,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- Content system: articles, videos, photography, game guides, media library.
create table public.content_items (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    content_type    text not null default 'article'
                    check (content_type in ('article','video','photo','game_guide','press','other')),
    status          text not null default 'draft'
                    check (status in ('draft','review','published')),
    body_md         text,
    media_url       text,
    author_person_id uuid references public.people(id) on delete set null,
    study_id        uuid references public.studies(id) on delete set null,
    game_id         uuid references public.games(id) on delete set null,
    published_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index grants_status_idx on public.grants(status);
create index programs_status_idx on public.institutional_programs(status);
create index content_status_idx on public.content_items(status);

do $$
declare t text;
begin
    foreach t in array array['grants','institutional_programs','content_items']
    loop
        execute format('alter table public.%I enable row level security;', t);
    end loop;
end $$;

-- Reads: any active staff member.
create policy grants_read on public.grants
    for select to authenticated using (public.is_active_app_user());
create policy programs_read on public.institutional_programs
    for select to authenticated using (public.is_active_app_user());
create policy content_read on public.content_items
    for select to authenticated using (public.is_active_app_user());

-- Writes: content also open to storefront (journalist + media editors).
create policy grants_write on public.grants
    for all to authenticated using (
        public.has_app_role(array['admin','executive','researcher'])
    ) with check (
        public.has_app_role(array['admin','executive','researcher'])
    );
create policy programs_write on public.institutional_programs
    for all to authenticated using (
        public.has_app_role(array['admin','executive','researcher'])
    ) with check (
        public.has_app_role(array['admin','executive','researcher'])
    );
create policy content_write on public.content_items
    for all to authenticated using (
        public.has_app_role(array['admin','executive','researcher','storefront'])
    ) with check (
        public.has_app_role(array['admin','executive','researcher','storefront'])
    );

-- Audit triggers on the new tables.
do $$
declare t text;
begin
    foreach t in array array['grants','institutional_programs','content_items']
    loop
        execute format('create trigger trg_audit3_%I after insert or update or delete on public.%I for each row execute function public.audit_row();', t, t);
    end loop;
end $$;

-- Seed ------------------------------------------------------------------
insert into public.grants (funder, agency_type, title, program_area, amount_cents, status, starts_on, ends_on)
select g.funder, g.atype, g.title, g.area, g.amt, g.status, g.starts_on::date, g.ends_on::date
from (values
    ('Institute of Museum and Library Services', 'government', 'Community Learning Through Games', 'Community engagement research', 5000000, 'submitted', '2026-10-01', '2027-09-30'),
    ('Ohio Arts Council', 'government', 'Playful Heritage Documentation', 'Game culture archiving', 1200000, 'awarded', '2026-09-01', '2027-08-31'),
    ('Buckeye Family Fun Centers', 'corporate', 'Prize Partner Research Match', 'Engagement baseline co-funding', 250000, 'awarded', '2026-10-01', '2026-12-31'),
    ('Franklin County Justice Programs Office', 'government', 'Closed-Network Pilot Evaluation', 'Institutional research', 0, 'prospect', null, null)
) as g(funder, atype, title, area, amt, status, starts_on, ends_on)
where not exists (select 1 from public.grants x where x.title = g.title);

insert into public.institutional_programs (partner_org_id, program_type, title, description, status, site_location_id, is_closed_network, consent_protocol_notes, starts_on)
select o.id, p.ptype, p.title, p.descr, p.status, loc.id, p.closed, p.consent, p.starts_on::date
from (values
    ('Franklin County Corrections', 'corrections', 'Closed-Network Sessions — Corrections Pilot', 'Structured Cohort Zero sessions under facility supervision with documented consent protocol.', 'active', true, 'Facility-approved intake script; consent re-verified each session; no personal devices permitted.', '2026-09-01'),
    ('Franklin County Corrections', 'corrections', 'Reintegration Skills Ladder', 'Cooperative gameplay progression supporting pre-release programming.', 'planning', true, 'Pending facility review board sign-off.', null),
    ('Columbus City Schools', 'education', 'After-School Board Game Cohorts', 'Weekly board-game cohorts studying turn-taking and persistence in middle schoolers.', 'planning', false, 'Parental consent forms required before any data collection.', null)
) as p(org, ptype, title, descr, status, closed, consent, starts_on)
left join public.organizations o on o.name = p.org
left join public.locations loc on loc.name = 'Franklin County Corrections — Closed Network'
where not exists (select 1 from public.institutional_programs x where x.title = p.title);

insert into public.content_items (title, content_type, status, body_md, published_at)
select c.title, c.ctype, c.status, c.body, c.published
from (values
    ('Why reaction mechanics keep players coming back', 'article', 'published', '## The signal
Across 17 sessions, games tagged with reaction-time mechanics showed the strongest persistence markers.

## What participants said
The engagement survey''s free-text answers repeatedly named focus and flow.', now() - interval '6 days'),
    ('Game Guide: Grid Runner basics', 'game_guide', 'published', '## Setup
Grid Runner runs 15 minutes for 1-4 players.

## Research notes
Reaction-time telemetry logs at 50ms resolution.', now() - interval '12 days'),
    ('Field notes: Linden Park Game Day', 'article', 'draft', '## Draft
Eight check-ins via QR, two walk-up registrations, judges ran three rotation blocks.', null),
    ('Closed-network pilot: behind the scenes', 'video', 'review', null, null)
) as c(title, ctype, status, body, published)
where not exists (select 1 from public.content_items x where x.title = c.title);
