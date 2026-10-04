-- 0018_corporate_packages.sql
-- Corporate research packages: $333 / 10 seats and $3,330 / 100 seats.
-- Recording a sale is one atomic, auditable action: the order row is stored,
-- the payout ledger auto-splits the gross into thirds (ledger_record_study_split),
-- and the charity allocation ($10 per seat) lands in charity_ledger.

create table if not exists public.corporate_orders (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_email text not null,
  seats integer not null check (seats in (10, 100)),
  price_cents bigint not null check (price_cents in (33300, 333000)),
  charity_cents bigint not null check (charity_cents in (10000, 100000)),
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.corporate_orders enable row level security;

drop policy if exists corporate_orders_staff_read on public.corporate_orders;
create policy corporate_orders_staff_read on public.corporate_orders
  for select
  using (has_app_role(ARRAY['admin'::text, 'executive'::text]));

create or replace function public.corporate_record_sale(
  p_company text,
  p_contact_email text,
  p_seats integer,
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price_cents bigint;
  v_charity_cents bigint;
  v_id uuid;
begin
  perform public.ledger_assert_staff();

  if p_seats = 10 then
    v_price_cents := 33300;   -- $333.00
    v_charity_cents := 10000; -- $10 per seat to charity
  elsif p_seats = 100 then
    v_price_cents := 333000;  -- $3,330.00
    v_charity_cents := 100000;
  else
    raise exception 'Unsupported package size: use 10 or 100 seats.';
  end if;

  if p_company is null or btrim(p_company) = '' then
    raise exception 'Company name is required.';
  end if;
  if p_contact_email is null or p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid contact email is required.';
  end if;

  insert into public.corporate_orders
    (company_name, contact_email, seats, price_cents, charity_cents, note, recorded_by)
  values
    (btrim(p_company), lower(btrim(p_contact_email)), p_seats, v_price_cents, v_charity_cents,
     nullif(btrim(coalesce(p_note, '')), ''), auth.uid())
  returning id into v_id;

  perform public.ledger_record_study_split(
    v_price_cents,
    null,
    'Corporate package — ' || p_seats || ' seats — ' || btrim(p_company)
  );

  insert into public.charity_ledger (member_id, transaction_cents, charity_cents, allocation_label)
  values (null, v_price_cents, v_charity_cents, 'corporate_package_' || p_seats || 'seats');

  return v_id;
end;
$$;
