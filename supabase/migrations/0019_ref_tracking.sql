-- 0019_ref_tracking.sql
-- Street-team worker tracking: personal ?ref= links with click + conversion
-- logging per contractor. Conversions post the blueprint commission
-- ($1 + 10% of the sale) straight into the payout ledger under the worker's
-- label, so the existing payouts desk pays them — no new money pipeline.

create table if not exists public.street_workers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ref_clicks (
  id bigint generated always as identity primary key,
  worker_id uuid not null references public.street_workers(id) on delete cascade,
  path text not null default '/',
  ua_hash text,
  day date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists ref_clicks_worker_created_idx on public.ref_clicks (worker_id, created_at);

create table if not exists public.ref_conversions (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.street_workers(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  kind text not null default 'membership' check (kind in ('membership','corporate_10','corporate_100')),
  gross_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (member_id, kind)
);
create index if not exists ref_conversions_worker_idx on public.ref_conversions (worker_id);

alter table public.street_workers enable row level security;
drop policy if exists street_workers_staff_read on public.street_workers;
create policy street_workers_staff_read on public.street_workers
  for select using (has_app_role(ARRAY['admin'::text, 'executive'::text]));
drop policy if exists street_workers_staff_write on public.street_workers;
create policy street_workers_staff_write on public.street_workers
  for all using (has_app_role(ARRAY['admin'::text, 'executive'::text]))
  with check (has_app_role(ARRAY['admin'::text, 'executive'::text]));

alter table public.ref_clicks enable row level security;
drop policy if exists ref_clicks_staff_read on public.ref_clicks;
create policy ref_clicks_staff_read on public.ref_clicks
  for select using (has_app_role(ARRAY['admin'::text, 'executive'::text]));

alter table public.ref_conversions enable row level security;
drop policy if exists ref_conversions_staff_read on public.ref_conversions;
create policy ref_conversions_staff_read on public.ref_conversions
  for select using (has_app_role(ARRAY['admin'::text, 'executive'::text]));

alter table public.members add column if not exists ref_worker_id uuid
  references public.street_workers(id) on delete set null;

-- Anonymous click logging (called server-side on ?ref= landings).
create or replace function public.ref_log_click(p_code text, p_path text default '/', p_ua text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker public.street_workers;
begin
  select * into v_worker from public.street_workers
    where code = upper(btrim(coalesce(p_code, ''))) and is_active;
  if not found then return; end if; -- unknown or retired codes are ignored
  insert into public.ref_clicks (worker_id, path, ua_hash, day)
  values (v_worker.id, left(btrim(coalesce(p_path, '/')), 300), md5(coalesce(p_ua, '')), current_date);
end;
$$;

-- Called by the new member right after signup: first active ref wins.
-- Writes the ledger row directly (the staff-gated RPC would reject a member caller).
create or replace function public.ref_attribute_signup(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_worker public.street_workers;
  v_amount bigint;
begin
  if p_code is null or btrim(p_code) = '' then return false; end if;
  select * into v_member from public.members where auth_user_id = auth.uid() limit 1;
  if not found then return false; end if;
  if v_member.ref_worker_id is not null then return false; end if;

  select * into v_worker from public.street_workers
    where code = upper(btrim(p_code)) and is_active;
  if not found then return false; end if;

  update public.members set ref_worker_id = v_worker.id where id = v_member.id;

  insert into public.ref_conversions (worker_id, member_id, kind, gross_cents)
  values (v_worker.id, v_member.id, 'membership', coalesce(v_member.paid_cents, 0));

  v_amount := 100 + round(coalesce(v_member.paid_cents, 0) * 10 / 100); -- $1 + 10%
  insert into public.payout_ledger (kind, status, payee_label, amount_cents, gross_cents, commission_pct, note)
  values ('street_team_sale', 'computed', v_worker.label, v_amount,
          coalesce(v_member.paid_cents, 0), 10,
          'Referral signup — ' || v_worker.code || ' — member #' || coalesce(v_member.player_number, 0));

  return true;
end;
$$;

-- Staff desk: add a worker and auto-generate a unique ref code.
create or replace function public.ref_create_worker(p_label text)
returns public.street_workers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_code text;
  v_row public.street_workers;
begin
  perform public.ledger_assert_staff();
  if p_label is null or btrim(p_label) = '' then
    raise exception 'Worker name is required.';
  end if;
  v_base := upper(regexp_replace(btrim(p_label), '[^A-Za-z0-9]', '', 'g'));
  if v_base = '' then v_base := 'WORKER'; end if;
  v_base := left(v_base, 8);
  loop
    v_code := v_base || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.street_workers where code = v_code);
  end loop;
  insert into public.street_workers (label, code) values (btrim(p_label), v_code)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.ref_set_worker_active(p_worker_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ledger_assert_staff();
  update public.street_workers set is_active = coalesce(p_active, not is_active) where id = p_worker_id;
end;
$$;

-- One call feeds both the admin desk and the Command Center telemetry strip.
create or replace function public.ref_desk_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ledger_assert_staff();
  return jsonb_build_object(
    'workers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', w.id, 'label', w.label, 'code', w.code, 'is_active', w.is_active,
        'created_at', w.created_at,
        'clicks_total', coalesce(c.total, 0),
        'clicks_7d', coalesce(c.week, 0),
        'conversions', coalesce(cv.total, 0),
        'gross_cents', coalesce(cv.gross, 0),
        'owed_cents', coalesce(pl.owed, 0),
        'paid_cents', coalesce(pl.paid, 0)
      ) order by coalesce(cv.total, 0) desc, w.created_at), '[]'::jsonb)
      from public.street_workers w
      left join (select worker_id, count(*) as total from public.ref_clicks group by 1) c on c.worker_id = w.id
      left join (select worker_id, count(*) as week from public.ref_clicks where created_at > now() - interval '7 days' group by 1) c7 on c7.worker_id = w.id
      left join (select worker_id, count(*) as total, sum(gross_cents) as gross from public.ref_conversions group by 1) cv on cv.worker_id = w.id
      left join (select payee_label,
                 sum(amount_cents) filter (where status = 'computed') as owed,
                 sum(amount_cents) filter (where status = 'paid') as paid
                 from public.payout_ledger group by 1) pl on pl.payee_label = w.label
    ),
    'totals', jsonb_build_object(
      'workers_active', (select count(*) from public.street_workers where is_active),
      'workers_total', (select count(*) from public.street_workers),
      'clicks_7d', (select count(*) from public.ref_clicks where created_at > now() - interval '7 days'),
      'clicks_total', (select count(*) from public.ref_clicks),
      'conversions', (select count(*) from public.ref_conversions),
      'attributed_members', (select count(*) from public.members where ref_worker_id is not null),
      'members_total', (select count(*) from public.members),
      'owed_cents', (select coalesce(sum(amount_cents), 0) from public.payout_ledger where kind like 'street_team%' and status = 'computed'),
      'paid_cents', (select coalesce(sum(amount_cents), 0) from public.payout_ledger where kind like 'street_team%' and status = 'paid')
    )
  );
end;
$$;
