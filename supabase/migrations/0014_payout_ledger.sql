-- 0014: PAYOUT LEDGER
-- Automates the blueprint's non-negotiable money rules:
--   * Studies: one-third participant / one-third interviewer / one-third platform.
--   * Judges: a flat percentage of each live session transaction they oversee.
--   * Street team: 50c per card, 75c per click, $1 + commission per sale.
-- Every row is computed (never hand-typed amounts), then marked paid by payroll.

create table if not exists public.payout_ledger (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'study_split', 'session_judge',
    'street_team_card', 'street_team_click', 'street_team_sale',
    'charity_allocation', 'adjustment')),
  status text not null default 'computed' check (status in ('computed', 'paid', 'void')),
  study_id uuid,
  session_id uuid,
  event_id uuid,
  payee_profile_id uuid,
  payee_label text,
  gross_cents bigint not null default 0 check (gross_cents >= 0),
  participant_cents bigint not null default 0,
  interviewer_cents bigint not null default 0,
  judge_cents bigint not null default 0,
  platform_cents bigint not null default 0,
  amount_cents bigint not null default 0,
  judge_pct numeric,
  commission_pct numeric,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payout_ledger enable row level security;

create policy payout_ledger_staff_read on public.payout_ledger
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'executive')
    )
  );

create index if not exists payout_ledger_kind_idx on public.payout_ledger (kind, status);
create index if not exists payout_ledger_created_idx on public.payout_ledger (created_at desc);

-- Staff guard shared by every ledger RPC: payouts are admin/executive business.
create or replace function public.ledger_assert_staff()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'executive')
  ) then
    raise exception 'Staff only: payouts are recorded and approved by admin or executive roles.';
  end if;
end $$;

-- Blueprint rule: fixed, even three-way study split. Remainder cents -> platform.
create or replace function public.ledger_record_study_split(
  p_gross_cents bigint,
  p_study_id uuid default null,
  p_note text default null
) returns public.payout_ledger
language plpgsql security definer set search_path = public as $$
declare
  v_third bigint;
  v_row public.payout_ledger;
begin
  perform public.ledger_assert_staff();
  if p_gross_cents is null or p_gross_cents < 0 then
    raise exception 'gross must be a non-negative amount of cents';
  end if;
  v_third := floor(p_gross_cents / 3);
  insert into public.payout_ledger (
    kind, status, study_id, gross_cents,
    participant_cents, interviewer_cents, platform_cents, note
  ) values (
    'study_split', 'computed', p_study_id, p_gross_cents,
    v_third, v_third, p_gross_cents - 2 * v_third, p_note
  ) returning * into v_row;
  return v_row;
end $$;

-- Blueprint rule: judges earn a flat percentage of sessions they personally judge.
create or replace function public.ledger_record_judge_payout(
  p_session_id uuid,
  p_gross_cents bigint,
  p_judge_pct numeric default 10,
  p_note text default null
) returns public.payout_ledger
language plpgsql security definer set search_path = public as $$
declare
  v_judge bigint;
  v_row public.payout_ledger;
begin
  perform public.ledger_assert_staff();
  if p_gross_cents is null or p_gross_cents < 0 then
    raise exception 'gross must be a non-negative amount of cents';
  end if;
  if p_judge_pct is null or p_judge_pct < 0 or p_judge_pct > 100 then
    raise exception 'judge percentage must be between 0 and 100';
  end if;
  v_judge := round(p_gross_cents * p_judge_pct / 100);
  insert into public.payout_ledger (
    kind, status, session_id, gross_cents,
    judge_cents, platform_cents, judge_pct, note
  ) values (
    'session_judge', 'computed', p_session_id, p_gross_cents,
    v_judge, p_gross_cents - v_judge, p_judge_pct, p_note
  ) returning * into v_row;
  return v_row;
end $$;

-- Blueprint rule: street team earns 50c/card, 75c/click, $1 + commission per sale.
create or replace function public.ledger_record_street_team(
  p_kind text,
  p_quantity int default 1,
  p_payee_label text default null,
  p_sale_cents bigint default 0,
  p_commission_pct numeric default 10,
  p_note text default null
) returns public.payout_ledger
language plpgsql security definer set search_path = public as $$
declare
  v_kind text;
  v_amount bigint;
  v_row public.payout_ledger;
begin
  perform public.ledger_assert_staff();
  if p_kind = 'card' then
    v_kind := 'street_team_card';
    v_amount := 50 * greatest(coalesce(p_quantity, 0), 0);
  elsif p_kind = 'click' then
    v_kind := 'street_team_click';
    v_amount := 75 * greatest(coalesce(p_quantity, 0), 0);
  elsif p_kind = 'sale' then
    v_kind := 'street_team_sale';
    v_amount := 100 * greatest(coalesce(p_quantity, 0), 0)
              + round(coalesce(p_sale_cents, 0) * coalesce(p_commission_pct, 10) / 100);
  else
    raise exception 'kind must be card, click, or sale';
  end if;
  insert into public.payout_ledger (
    kind, status, payee_label, amount_cents, gross_cents, commission_pct, note
  ) values (
    v_kind, 'computed', p_payee_label, v_amount, coalesce(p_sale_cents, 0), p_commission_pct, p_note
  ) returning * into v_row;
  return v_row;
end $$;

-- Payroll: mark computed rows as paid (also voids via status change if needed later).
create or replace function public.ledger_mark_paid(p_ids uuid[])
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  perform public.ledger_assert_staff();
  update public.payout_ledger
    set status = 'paid', paid_at = now()
    where id = any(p_ids) and status = 'computed';
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- One-call snapshot for the staff page: totals by kind + recent entries.
create or replace function public.ledger_overview()
returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'by_kind', (
      select coalesce(json_agg(x), '[]'::json) from (
        select kind,
               count(*) as entries,
               sum(gross_cents) as gross_cents,
               sum(participant_cents) as participant_cents,
               sum(interviewer_cents) as interviewer_cents,
               sum(judge_cents) as judge_cents,
               sum(platform_cents) as platform_cents,
               sum(amount_cents) as amount_cents,
               sum(case when status = 'paid' then 1 else 0 end) as paid_count
        from public.payout_ledger
        where status <> 'void'
        group by kind
        order by kind
      ) x
    ),
    'recent', (
      select coalesce(json_agg(r), '[]'::json) from (
        select id, kind, status, payee_label, gross_cents,
               participant_cents, interviewer_cents, judge_cents,
               platform_cents, amount_cents, note,
               to_char(created_at, 'YYYY-MM-DD HH24:MI') as created_at
        from public.payout_ledger
        order by created_at desc
        limit 40
      ) r
    )
  );
$$;

grant execute on function public.ledger_record_study_split(bigint, uuid, text) to authenticated;
grant execute on function public.ledger_record_judge_payout(uuid, bigint, numeric, text) to authenticated;
grant execute on function public.ledger_record_street_team(text, int, text, bigint, numeric, text) to authenticated;
grant execute on function public.ledger_mark_paid(uuid[]) to authenticated;
grant execute on function public.ledger_overview() to authenticated;
