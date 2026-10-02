-- ============================================================================
-- 0005 — BRAND MENTION TALLY
-- Every time a sponsor brand is named (survey free-text, session notes,
-- event announcements, manual staff logs), one row is written here.
-- Tallies aggregate per sponsor to prove deliverables on sponsor reports.
-- ============================================================================

create table if not exists public.brand_mentions (
    id           uuid primary key default gen_random_uuid(),
    sponsor_id   uuid not null references public.sponsors(id) on delete cascade,
    source       text not null default 'manual'
                 check (source in ('survey_response', 'session_note', 'event_announcement', 'manual')),
    context_ref  text,            -- session / event / response id, nullable
    phrase       text not null,   -- the text in which the brand was named
    occurred_at  timestamptz not null default now(),
    created_at   timestamptz not null default now()
);

create index if not exists idx_brand_mentions_sponsor  on public.brand_mentions(sponsor_id);
create index if not exists idx_brand_mentions_occurred on public.brand_mentions(occurred_at);

alter table public.brand_mentions enable row level security;

create policy "auth write brand mentions" on public.brand_mentions
    for all to authenticated using (true) with check (true);
