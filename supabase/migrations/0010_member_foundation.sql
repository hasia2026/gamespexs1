-- 0010 — MEMBER FOUNDATION: dual pricing, charity ledger, player numbers, 72h free look

create sequence if not exists member_player_number_seq start 1001;

create or replace function public.next_player_number() returns integer language sql stable as
$$ select nextval('member_player_number_seq'::regclass)::int $$;

create table public.members (
    id              uuid primary key default gen_random_uuid(),
    auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
    email           text not null unique,
    first_name      text not null,
    last_initial    text not null check (char_length(last_initial) = 1),
    player_number   integer unique not null default public.next_player_number(),  -- reserved at signup, permanent forever
    tier            text not null check (tier in ('standard','premium')),
    paid_cents      integer not null default 0,
    consent_status  text not null default 'free_look'
                    check (consent_status in ('free_look','locked_bubble')),
    free_look_started_at timestamptz not null default now(),
    free_look_ends_at    timestamptz not null default now() + interval '72 hours',
    signature_color_1 text,
    signature_color_2 text,
    signature_image text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- 1% charity allocation: exactly $10.00 of every $110.00 premium bundle.
create table public.charity_ledger (
    id              uuid primary key default gen_random_uuid(),
    member_id       uuid references public.members(id) on delete set null,
    transaction_cents integer not null,
    charity_cents   integer not null,
    allocation_label text not null default 'premium_bundle_1pct',
    created_at      timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.charity_ledger enable row level security;

create policy members_read_own on public.members
    for select to authenticated
    using (auth_user_id = (select auth.uid()));

create policy charity_admin_read on public.charity_ledger
    for select to authenticated using (
        public.has_app_role(array['admin','executive'])
    );

-- Member self-service snapshot: own row + free-look seconds remaining.
create or replace function public.member_me()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    m public.members;
begin
    select * into m from public.members
    where auth_user_id = (select auth.uid()) limit 1;

    if m.id is null then
        return jsonb_build_object('ok', false, 'error', 'No member profile found.');
    end if;

    return jsonb_build_object(
        'ok', true,
        'member', jsonb_build_object(
            'id', m.id,
            'first_name', m.first_name,
            'last_initial', m.last_initial,
            'player_number', m.player_number,
            'tier', m.tier,
            'paid_cents', m.paid_cents,
            'consent_status', m.consent_status,
            'free_look_ends_at', m.free_look_ends_at,
            'seconds_remaining', greatest(0, extract(epoch from (m.free_look_ends_at - now()))::bigint),
            'signature_color_1', m.signature_color_1,
            'signature_color_2', m.signature_color_2
        )
    );
end;
$$;

-- L4: lock the bubble. Early manual opt-in allowed (blueprint); the 72h clock
-- auto-locks at 00:00:00. Assigns the permanent sequential Player Number.
create or replace function public.lock_member_bubble(
    p_color_1 text,
    p_color_2 text,
    p_signature_image text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    m public.members;
    v_number integer;
begin
    select * into m from public.members
    where auth_user_id = (select auth.uid()) limit 1;

    if m.id is null then
        return jsonb_build_object('ok', false, 'error', 'No member profile found.');
    end if;
    if m.consent_status = 'locked_bubble' then
        return jsonb_build_object('ok', false, 'error', 'Your bubble is already locked.');
    end if;
    if coalesce(p_color_1, '') = '' or coalesce(p_color_2, '') = '' then
        return jsonb_build_object('ok', false, 'error', 'Choose one color from each pool.');
    end if;
    if coalesce(p_signature_image, '') = '' then
        return jsonb_build_object('ok', false, 'error', 'Sign the canvas to complete consent.');
    end if;

    v_number := coalesce(m.player_number, public.next_player_number());

    update public.members set
        consent_status = 'locked_bubble',
        player_number = v_number,
        signature_color_1 = p_color_1,
        signature_color_2 = p_color_2,
        signature_image = p_signature_image,
        updated_at = now()
    where id = m.id;

    return jsonb_build_object('ok', true, 'player_number', v_number);
end;
$$;

revoke all on function public.member_me() from public, anon;
grant execute on function public.member_me() to authenticated;
revoke all on function public.lock_member_bubble(text, text, text) from public, anon;
grant execute on function public.lock_member_bubble(text, text, text) to authenticated;
