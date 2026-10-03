-- 0015 — BOTH-FEES MEMBERSHIP OPTION (Steve: "Option to do both membership
-- fees if they want... leave it as an option to see what they do")
-- Members may pay the $2.25 activation AND the $110 premium bundle ($112.25).
-- The choice stays open so signup behavior can be observed on the Command
-- Center. Applied in two chunks (a: constraint + trigger, b: staff RPC).

-- ---------------------------------------------------------------------------
-- a) Allow 'both' as a tier and teach the signup trigger the $112.25 total.
-- ---------------------------------------------------------------------------

alter table public.members drop constraint members_tier_check;
alter table public.members add constraint members_tier_check
    check (tier in ('standard', 'premium', 'both'));

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
    v_member_id uuid;
begin
    if v_tier not in ('standard', 'premium', 'both') then
        v_tier := 'standard';
        v_paid := 225;
    end if;

    insert into public.members (
        auth_user_id, email, first_name, last_initial, tier, paid_cents
    ) values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'first_name', 'Player'),
        upper(coalesce(left(new.raw_user_meta_data ->> 'last_initial', 1), 'X')),
        v_tier::public.members.tier%type,
        v_paid
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
-- b) Staff visibility: counts by membership choice for the Command Center.
-- ---------------------------------------------------------------------------

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
        'charity_cents',   coalesce((select sum(charity_cents) from public.charity_ledger), 0)
    );
end;
$$;

revoke all on function public.membership_choices() from public, anon;
grant execute on function public.membership_choices() to authenticated;
