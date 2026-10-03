-- 0016 — AGE VERIFICATION (blueprint Level 2, safe pattern).
-- Attestation checkbox at join + a verified_18 flag written only by a vendor
-- KYC result. We NEVER store ID photos or dates of birth — just derived flags
-- and the vendor's verification reference. See docs/AGE_VERIFICATION_LEGAL_NOTES.md.
-- Applied in two chunks (a: columns + trigger, b: member_me + membership_choices),
-- plus a hotfix: the original `v_tier::public.members.tier%type` three-part cast
-- broke every signup with "cross-database references are not implemented" (0A000).
-- Plain text + the column's check constraint is the correct form.

-- ---------------------------------------------------------------------------
-- a) Age columns + signup trigger records the attestation.
-- ---------------------------------------------------------------------------

alter table public.members
    add column if not exists attested_18 boolean not null default false,
    add column if not exists attested_at timestamptz,
    add column if not exists verified_18 boolean not null default false,
    add column if not exists verified_at timestamptz,
    add column if not exists verification_vendor text,
    add column if not exists verification_ref text;

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_tier text := lower(coalesce(new.raw_user_meta_data ->> 'tier', 'standard'));
    v_paid integer := case v_tier
        when 'premium' then 11000
        when 'both'    then 11225
        else 225
    end;
    v_attested boolean := (new.raw_user_meta_data ->> 'attested_18') = 'true';
    v_member_id uuid;
begin
    if v_tier not in ('standard', 'premium', 'both') then
        v_tier := 'standard';
        v_paid := 225;
    end if;

    insert into public.members (
        auth_user_id, email, first_name, last_initial, tier, paid_cents,
        attested_18, attested_at
    ) values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'first_name', 'Player'),
        upper(coalesce(left(new.raw_user_meta_data ->> 'last_initial', 1), 'X')),
        v_tier,
        v_paid,
        v_attested,
        case when v_attested then now() else null end
    )
    on conflict (auth_user_id) do nothing
    returning id into v_member_id;

    -- The charity allocation lives in the $110 bundle portion; 'both' includes it.
    if v_member_id is not null and v_tier in ('premium', 'both') then
        insert into public.charity_ledger (member_id, transaction_cents, charity_cents)
        values (v_member_id, v_paid, 1000);
    end if;

    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- b) Surface age-verification status to the member and staff views.
-- ---------------------------------------------------------------------------

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
            'signature_color_2', m.signature_color_2,
            'attested_18', m.attested_18,
            'verified_18', m.verified_18
        )
    );
end;
$$;

create or replace function public.membership_choices()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.has_app_role(array['admin','executive']) then
        raise exception 'Staff only: membership choices are visible to admin and executive roles.'
        using errcode = 'P0001';
    end if;

    return jsonb_build_object(
        'standard',        coalesce((select count(*) from public.members where tier = 'standard'), 0),
        'premium',         coalesce((select count(*) from public.members where tier = 'premium'), 0),
        'both',            coalesce((select count(*) from public.members where tier = 'both'), 0),
        'total_members',   coalesce((select count(*) from public.members), 0),
        'collected_cents', coalesce((select sum(paid_cents) from public.members), 0),
        'charity_cents',   coalesce((select sum(charity_cents) from public.charity_ledger), 0),
        'attested_18',     coalesce((select count(*) from public.members where attested_18), 0),
        'verified_18',     coalesce((select count(*) from public.members where verified_18), 0)
    );
end;
$$;
