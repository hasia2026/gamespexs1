-- 0021 — STRIPE PAYMENTS
-- Money becomes real: the Stripe webhook (not the signup form) is the source
-- of truth for what a member has actually paid. Signup still creates the row
-- optimistically; the webhook flips payment_status and stamps paid_cents
-- when checkout.session.completed arrives.
--
-- payment_status:
--   'unpaid'      — signed up, checkout not completed (free-look allowed)
--   'paid'        — webhook confirmed the payment
--   'simulated'   — demo currency (pre-Stripe seed data keeps this)
--
-- paid_cents semantics change: 0 until the webhook confirms money.

alter table public.members
    add column if not exists payment_status text not null default 'unpaid'
        check (payment_status in ('unpaid', 'paid', 'simulated'));

-- Existing seeded/demo members keep their historical amounts but are marked
-- simulated so they never read as real revenue.
update public.members set payment_status = 'simulated' where paid_cents > 0;

-- Checkout-session dedupe: one row per Stripe checkout session id.
create table if not exists public.stripe_checkout_sessions (
    id           uuid primary key default gen_random_uuid(),
    session_id   text not null unique,
    member_id    uuid not null references public.members(id) on delete cascade,
    amount_cents bigint not null,
    tier         text not null,
    created_at   timestamptz not null default now()
);

alter table public.stripe_checkout_sessions enable row level security;

-- Only the service role (webhook) touches this table; no client policies.
revoke all on public.stripe_checkout_sessions from anon, authenticated;

-- Webhook-side helper: idempotent payment recording. Called by the
-- /api/stripe/webhook route with the member id resolved from session metadata.
create or replace function public.member_mark_paid(
    p_auth_user_id uuid,
    p_session_id text,
    p_amount_cents bigint,
    p_tier text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_member_id uuid;
begin
    -- Webhook calls this with the service-role key; every other key (anon,
    -- authenticated) is rejected. This is the money path — it must never be
    -- client-callable.
    if coalesce(auth.role(), '') <> 'service_role' then
        return jsonb_build_object('ok', false, 'error', 'service role only');
    end if;

    select id into v_member_id from public.members
    where auth_user_id = p_auth_user_id limit 1;
    if v_member_id is null then
        return jsonb_build_object('ok', false, 'error', 'member not found');
    end if;

    -- Idempotency: a replayed webhook hits this unique key and stops.
    insert into public.stripe_checkout_sessions (session_id, member_id, amount_cents, tier)
    values (p_session_id, v_member_id, p_amount_cents, p_tier)
    on conflict (session_id) do nothing;
    if not exists (
        select 1 from public.stripe_checkout_sessions where session_id = p_session_id
    ) then
        return jsonb_build_object('ok', true, 'duplicate', true);
    end if;

    update public.members set
        tier = coalesce(nullif(p_tier, ''), tier),
        paid_cents = p_amount_cents,
        payment_status = 'paid',
        updated_at = now()
    where id = v_member_id;

    -- Charity allocation travels with the premium bundle portion ($110 tier or
    -- $112.25 both) — exactly 1% ($10) of the bundle, same rule as the DB trigger.
    if p_tier in ('premium', 'both') then
        insert into public.charity_ledger (member_id, transaction_cents, charity_cents)
        values (v_member_id, p_amount_cents, 1000);
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.member_mark_paid(uuid, text, bigint, text) from public, anon, authenticated;

-- Surface payment_status to the member dashboard snapshot.
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
            'payment_status', m.payment_status,
            'consent_status', m.consent_status,
            'free_look_ends_at', m.free_look_ends_at,
            'seconds_remaining', greatest(0, extract(epoch from (m.free_look_ends_at - now()))::bigint),
            'signature_color_1', m.signature_color_1,
            'signature_color_2', m.signature_color_2,
            'attested_18', m.attested_18,
            'verified_18', m.verified_18
        )
    );
end;
$$;
