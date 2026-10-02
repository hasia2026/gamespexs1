-- 0012 — QUADRANT ENGINE: 4-quadrant matrix, balanced routing, star catalog, 14-day lockouts
-- Blueprint: 2x2 symmetrical screen matrix (Q1 team ball, Q2 video, Q3 board, Q4 card/odd),
-- 50/50 partitions, every questionnaire shuffled evenly across quadrants,
-- 1-to-5 star catalog ratings with genre unlock/lockout loops,
-- 14-day competitor lockout after a completed study.
--
-- NOTE: applied to production as two sequential migrations:
--   quadrant_engine_matrix          (sections 1–2)
--   quadrant_engine_routing_ratings (section 3 + catalog_ratings/genre_lockouts/grants)
-- plus catalog_pulse() added separately (community star averages).

-- ------------------------------------------------------------------
-- 1. Quadrant dimension on games (derived from category name)
-- ------------------------------------------------------------------

create table if not exists public.quadrants (
    code        text primary key,
    position    integer not null unique,
    label       text not null,
    blurb       text not null
);

insert into public.quadrants (code, position, label, blurb) values
    ('q1', 1, 'Team Ball',      'Team and field games — big movement, big voices.'),
    ('q2', 2, 'Video',          'Screen games — reflexes, stories, soundtracks.'),
    ('q3', 3, 'Board',          'Tabletop strategy — dice, tiles, and long thinks.'),
    ('q4', 4, 'Card and Odd',   'Cards, paper, and the gloriously strange.')
on conflict (code) do nothing;

-- Games carry their quadrant; staff can override the derived default.
alter table public.games
    add column if not exists quadrant text references public.quadrants(code);

create or replace function public.derive_game_quadrant()
returns trigger
language plpgsql
as $body$
declare
    v_name text;
begin
    if new.category_id is null then
        return new;
    end if;
    select lower(name) into v_name from public.game_categories where id = new.category_id;
    new.quadrant :=
        case
            when v_name like '%sports%' or v_name like '%team%' then 'q1'
            when v_name like '%video%' then 'q2'
            when v_name like '%board%' or v_name like '%paper%' then 'q3'
            when v_name like '%card%' or v_name like '%odd%' then 'q4'
            else 'q4'
        end;
    return new;
end;
$body$;

drop trigger if exists trg_games_quadrant on public.games;
create trigger trg_games_quadrant
    before insert or update of category_id on public.games
    for each row execute function public.derive_game_quadrant();

-- Backfill existing rows (trigger does not fire for manual updates).
update public.games g
set quadrant = case
    when lower(gc.name) like '%sports%' or lower(gc.name) like '%team%' then 'q1'
    when lower(gc.name) like '%video%' then 'q2'
    when lower(gc.name) like '%board%' or lower(gc.name) like '%paper%' then 'q3'
    else 'q4'
end
from public.game_categories gc
where g.category_id = gc.id and g.quadrant is null;

-- ------------------------------------------------------------------
-- 2. Quadrant-balanced question routing on surveys
-- ------------------------------------------------------------------

alter table public.survey_questions
    add column if not exists quadrant text references public.quadrants(code);

-- Every questionnaire is shuffled evenly across the 4 quadrants (50/50 partition rule):
-- deal questions round-robin q1, q2, q3, q4 by ordinal.
with ranked as (
    select id, ((ordinal - 1) % 4) + 1 as slot
    from public.survey_questions
)
update public.survey_questions q
set quadrant = 'q' || ranked.slot
from ranked
where q.id = ranked.id;

do $body$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'survey_questions_quadrant_check'
          and conrelid = 'public.survey_questions'::regclass
    ) then
        alter table public.survey_questions
            add constraint survey_questions_quadrant_check
            check (quadrant in ('q1','q2','q3','q4'));
    end if;
end;
$body$;

-- ------------------------------------------------------------------
-- 3. Balanced shuffled routing plan (kiosk + member safe)
-- ------------------------------------------------------------------
-- Returns questions of a survey dealt round-robin across the 4 quadrants,
-- each quadrant shuffled, cut to the survey question_limit.
-- Public like the other kiosk endpoints: reveals order only, never answers.

create or replace function public.quadrant_routing_plan(p_survey_id uuid)
returns table (
    question_id uuid,
    ordinal integer,
    prompt text,
    question_type text,
    options jsonb,
    required boolean,
    quadrant text
)
language sql
security definer
set search_path = public
as $body$
    with pool as (
        select q.id, q.ordinal, q.prompt, q.question_type, q.options, q.required, q.quadrant,
               row_number() over (
                   partition by q.quadrant
                   order by md5(q.id::text || random()::text)
               ) as qpos
        from public.survey_questions q
        where q.survey_id = p_survey_id and q.quadrant is not null
    ),
    capped as (
        select least(question_limit, (select count(*) from pool))::int as take
        from public.surveys where id = p_survey_id
    ),
    eligible as (
        select pool.*, c.take
        from pool, capped c
        where pool.qpos <= ceil(c.take / 4.0)
    ),
    dealt as (
        select *, row_number() over (
            order by qpos,
                     case quadrant when 'q1' then 1 when 'q2' then 2 when 'q3' then 3 else 4 end
        ) as deal_no
        from eligible
    )
    select d.id, d.ordinal, d.prompt, d.question_type, d.options, d.required, d.quadrant
    from dealt d
    where d.deal_no <= (select take from capped)
    order by d.deal_no
$body$;

-- ------------------------------------------------------------------
-- 4. Catalog ratings: 1-to-5 stars from members on games
-- ------------------------------------------------------------------

create table if not exists public.catalog_ratings (
    id          uuid primary key default gen_random_uuid(),
    member_id   uuid not null references public.members(id) on delete cascade,
    game_id     uuid not null references public.games(id) on delete cascade,
    stars       integer not null check (stars between 1 and 5),
    quadrant    text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (member_id, game_id)
);

alter table public.catalog_ratings enable row level security;

drop policy if exists catalog_ratings_member_all on public.catalog_ratings;
create policy catalog_ratings_member_all on public.catalog_ratings
    for all to authenticated
    using (member_id in (select id from public.members where auth_user_id = auth.uid()))
    with check (member_id in (select id from public.members where auth_user_id = (select auth.uid())));

drop policy if exists catalog_ratings_staff_read on public.catalog_ratings;
create policy catalog_ratings_staff_read on public.catalog_ratings
    for select to authenticated
    using (public.is_active_app_user());

-- ------------------------------------------------------------------
-- 5. Genre lockouts: 14-day competitor lock after a completed study
-- ------------------------------------------------------------------

create table if not exists public.genre_lockouts (
    id          uuid primary key default gen_random_uuid(),
    member_id   uuid not null references public.members(id) on delete cascade,
    game_id     uuid not null references public.games(id) on delete cascade,
    quadrant    text,
    reason      text not null default 'study_completed',
    started_at  timestamptz not null default now(),
    expires_at  timestamptz not null default now() + interval '14 days',
    unique (member_id, game_id)
);

create index if not exists genre_lockouts_member_idx
    on public.genre_lockouts (member_id, expires_at);

alter table public.genre_lockouts enable row level security;

drop policy if exists genre_lockouts_member_read on public.genre_lockouts;
create policy genre_lockouts_member_read on public.genre_lockouts
    for select to authenticated
    using (member_id in (select id from public.members where auth_user_id = (select auth.uid())));

drop policy if exists genre_lockouts_staff_all on public.genre_lockouts;
create policy genre_lockouts_staff_all on public.genre_lockouts
    for all to authenticated
    using (public.is_active_app_user())
    with check (public.is_active_app_user());

-- Completing a study on a game locks that member out of its quadrant rivals for 14 days.
create or replace function public.issue_genre_lockout()
returns trigger
language plpgsql
security definer
set search_path = public
as $body$
declare
    v_member uuid;
    v_quad   text;
begin
    if new.status <> 'complete' or new.game_id is null then
        return new;
    end if;
    select id into v_member from public.members where auth_user_id = auth.uid();
    if v_member is null then
        return new;
    end if;
    select quadrant into v_quad from public.games where id = new.game_id;

    insert into public.genre_lockouts (member_id, game_id, quadrant)
    values (v_member, new.game_id, v_quad)
    on conflict (member_id, game_id) do update
        set started_at = now(),
            expires_at = now() + interval '14 days',
            quadrant = excluded.quadrant;

    return new;
end;
$body$;

drop trigger if exists trg_session_genre_lockout on public.research_sessions;
create trigger trg_session_genre_lockout
    after insert or update of status on public.research_sessions
    for each row
    when (new.status = 'complete')
    execute function public.issue_genre_lockout();

-- ------------------------------------------------------------------
-- 6. Community star pulse + grants
-- ------------------------------------------------------------------

create or replace function public.catalog_pulse()
returns table (game_id uuid, title text, quadrant text, avg_stars numeric, rating_count bigint)
language sql
security definer
set search_path = public
as $body$
    select g.id, g.title, g.quadrant,
           round(avg(r.stars), 1) as avg_stars,
           count(r.id) as rating_count
    from public.games g
    left join public.catalog_ratings r on r.game_id = g.id
    where g.is_active
    group by g.id, g.title, g.quadrant
$body$;

revoke all on function public.quadrant_routing_plan(uuid) from public, anon, authenticated;
grant execute on function public.quadrant_routing_plan(uuid) to anon, authenticated;

revoke all on function public.catalog_pulse() from public, anon;
grant execute on function public.catalog_pulse() to authenticated;
