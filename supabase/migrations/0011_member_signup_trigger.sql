-- 0011 — MEMBER SIGNUP TRIGGER: provisions members + charity ledger on auth signup.
-- The client signs up through Supabase Auth (first_name, last_initial, tier in
-- user_metadata); this trigger creates the member row and, for premium, the
-- exact 1% charity ledger entry ($10.00 of every $110.00 bundle).

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_tier text := lower(coalesce(new.raw_user_meta_data ->> 'tier', 'standard'));
    v_paid integer := case when v_tier = 'premium' then 11000 else 225 end;
    v_member_id uuid;
begin
    if v_tier not in ('standard', 'premium') then
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

    if v_member_id is not null and v_tier = 'premium' then
        insert into public.charity_ledger (member_id, transaction_cents, charity_cents)
        values (v_member_id, v_paid, 1000);
    end if;

    return new;
end;
$$;

drop trigger if exists trg_new_member on auth.users;
create trigger trg_new_member
    after insert on auth.users
    for each row execute function public.handle_new_member();
