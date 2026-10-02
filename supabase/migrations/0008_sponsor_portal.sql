-- 0008 — SPONSOR PORTAL + COMMUNITY WIDENING
-- 1) profiles.role widened to include 'interviewer' and 'sponsor'.
-- 2) profiles.sponsor_id links a sponsor contact to their sponsor record.
-- 3) sponsor_portal_snapshot(): security-definer RPC returning ONLY the
--    caller's own sponsor data (mentions, activations, engagement counts).
-- 4) Community system: partner organizations visible to all active staff.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
    add constraint profiles_role_check check (role in (
        'admin','executive','researcher','field_operator','judge','storefront',
        'sponsor_manager','viewer','interviewer','sponsor'
    ));

alter table public.profiles
    add column if not exists sponsor_id uuid references public.sponsors(id) on delete set null;

drop policy if exists organizations_read on public.organizations;
create policy organizations_read on public.organizations
    for select to authenticated using (public.is_active_app_user());

create or replace function public.sponsor_portal_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_sponsor_id uuid;
    v_sponsor record;
begin
    select p.sponsor_id into v_sponsor_id
    from public.profiles p
    where p.id = (select auth.uid()) and p.is_active = true and p.role = 'sponsor';

    if v_sponsor_id is null then
        return jsonb_build_object('ok', false, 'error', 'This account is not linked to a sponsor.');
    end if;

    select * into v_sponsor from public.sponsors s where s.id = v_sponsor_id;

    return jsonb_build_object(
        'ok', true,
        'sponsor', jsonb_build_object(
            'name', v_sponsor.name,
            'tier', v_sponsor.tier,
            'contact_name', v_sponsor.contact_name,
            'is_prize_partner', v_sponsor.is_prize_partner
        ),
        'mentions_total', (select count(*) from public.brand_mentions m where m.sponsor_id = v_sponsor_id),
        'mentions_recent', coalesce((
            select jsonb_agg(jsonb_build_object(
                'phrase', m.phrase, 'source', m.source, 'occurred_at', m.occurred_at
            ) order by m.occurred_at desc)
            from (select * from public.brand_mentions where sponsor_id = v_sponsor_id order by occurred_at desc limit 10) m
        ), '[]'::jsonb),
        'activations', coalesce((
            select jsonb_agg(jsonb_build_object(
                'event_title', e.title,
                'event_date', e.starts_at,
                'package_name', pk.name,
                'fee_cents', es.fee_cents,
                'checkins', (select count(*) from public.event_checkins c where c.event_id = e.id),
                'mentions', (select count(*) from public.brand_mentions m
                             where m.sponsor_id = v_sponsor_id and m.context_ref = e.id::text),
                'engagements', (select count(*) from public.event_checkins c where c.event_id = e.id)
                             + (select count(*) from public.brand_mentions m
                                where m.sponsor_id = v_sponsor_id and m.context_ref = e.id::text)
            ) order by e.starts_at desc)
            from public.event_sponsorships es
            join public.sponsor_packages pk on pk.id = es.package_id
            join public.events e on e.id = es.event_id
            where pk.sponsor_id = v_sponsor_id
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.sponsor_portal_snapshot() from public, anon;
grant execute on function public.sponsor_portal_snapshot() to authenticated;
