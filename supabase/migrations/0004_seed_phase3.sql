-- ============================================================================
-- GAMESPEXS PHASE 3 SEED — fleet, routes, events, teams, equipment, gaze
-- Run after 0003_field_ops.sql
-- ============================================================================

-- Fleet -------------------------------------------------------------------------
insert into public.mobile_units (name, call_sign, make_model, status)
select u.name, u.call_sign, u.make, u.status
from (values
    ('Unit One — Franklin',   'GSX-1', 'Ford Transit High Roof', 'active'),
    ('Unit Two — Northeast',  'GSX-2', 'Mercedes Sprinter 2500', 'active'),
    ('Unit Three — Reserve',  'GSX-3', 'Ford Transit Medium Roof', 'maintenance')
) as u(name, call_sign, make, status)
where not exists (select 1 from public.mobile_units x where x.name = u.name);

-- Routes with stops ---------------------------------------------------------------
insert into public.routes (mobile_unit_id, name, route_date, status)
select mu.id, r.name, r.route_date::date, r.status
from (values
    ('GSX-1', 'Northeast Corridor Run', (current_date - 12), 'complete'),
    ('GSX-2', 'Linden Park Loop',       (current_date - 5),  'complete'),
    ('GSX-1', 'Eastmoor Circuit',       (current_date + 3),  'planned')
) as r(unit, name, route_date, status)
join public.mobile_units mu on mu.call_sign = r.unit
where not exists (select 1 from public.routes x where x.name = r.name);

insert into public.route_stops (route_id, location_id, stop_order, arrive_at, depart_at)
select rt.id, loc.id, s.ord, s.arr::time, s.dep::time
from (values
    ('Northeast Corridor Run', 1, '09:00', '11:30'),
    ('Northeast Corridor Run', 3, '12:30', '15:00'),
    ('Linden Park Loop',       1, '10:00', '13:00'),
    ('Linden Park Loop',       2, '14:00', '17:00'),
    ('Eastmoor Circuit',       3, '09:30', '12:00'),
    ('Eastmoor Circuit',       2, '13:30', '16:30')
) as s(route_name, ord, arr, dep)
join public.routes rt  on rt.name = s.route_name
join public.locations loc on loc.location_type = case s.ord
    when 1 then (case when s.route_name = 'Linden Park Loop' then 'storefront' else 'venue' end)
    else 'mobile_stop' end
where not exists (
    select 1 from public.route_stops x
    where x.route_id = rt.id and x.stop_order = s.ord
);

-- Events ---------------------------------------------------------------------------
insert into public.events (code, title, event_type, status, starts_at, ends_at, location_id, study_id, expected_attendance)
select e.code, e.title, e.etype, e.status,
       now() + (e.offset_days || ' days')::interval,
       now() + ((e.offset_days || ' days')::interval) + interval '4 hours',
       loc.id, st.id, e.att
from (values
    ('EVT-2026-014', 'Linden Park Game Day',        'community',  'complete', -5,  120),
    ('EVT-2026-015', 'Eastmoor Family Night',       'community',  'planned',   7,  200),
    ('EVT-2026-016', 'Closed-Network Session Block','institutional','planned', 10,  40),
    ('EVT-2026-017', 'Sponsor Activation — Corridor Run', 'sponsor_activation', 'complete', -12, 90)
) as e(code, title, etype, status, offset_days, att)
left join public.locations loc on loc.name = case
    when e.etype = 'institutional' then 'Franklin County Corrections — Closed Network'
    when e.etype = 'sponsor_activation' then 'Eastmoor Community Center'
    else 'Linden Park Mobile Stop' end
left join public.studies st on st.code = 'GSX-2026-001'
where not exists (select 1 from public.events x where x.code = e.code);

-- Field teams ----------------------------------------------------------------------
insert into public.field_teams (name)
select t.name from (values ('Franklin Day Team'), ('Corridor Night Crew')) as t(name)
where not exists (select 1 from public.field_teams x where x.name = t.name);

insert into public.field_team_members (team_id, person_id, role_on_team)
select ft.id, p.id, m.role
from (values
    ('Franklin Day Team',    'dana@gamespexs.example',  'lead'),
    ('Franklin Day Team',    'marcus@gamespexs.example','interviewer'),
    ('Franklin Day Team',    'priya@gamespexs.example', 'judge'),
    ('Corridor Night Crew',  'tom@gamespexs.example',   'lead'),
    ('Corridor Night Crew',  'elena@gamespexs.example', 'driver')
) as m(team, email, role)
join public.field_teams ft on ft.name = m.team
join public.people p       on p.email = m.email
where not exists (
    select 1 from public.field_team_members x
    where x.team_id = ft.id and x.person_id = p.id
);

insert into public.event_team_assignments (event_id, team_id)
select ev.id, ft.id
from (values
    ('EVT-2026-014', 'Franklin Day Team'),
    ('EVT-2026-015', 'Franklin Day Team'),
    ('EVT-2026-016', 'Corridor Night Crew'),
    ('EVT-2026-017', 'Corridor Night Crew')
) as a(event_code, team)
join public.events ev      on ev.code = a.event_code
join public.field_teams ft on ft.name = a.team
where not exists (
    select 1 from public.event_team_assignments x
    where x.event_id = ev.id and x.team_id = ft.id
);

-- Equipment ------------------------------------------------------------------------
insert into public.equipment (name, equipment_type, serial_number, status, assigned_unit_id)
select q.name, q.etype, q.serial, q.status, mu.id
from (values
    ('Tobii Eye Tracker 5',        'eye_tracker',    'TOB-88231', 'in_use', 'GSX-1'),
    ('PlayStation 5 — Unit 1',     'console',        'PS5-11452', 'in_use', 'GSX-1'),
    ('Nintendo Switch OLED — Unit 2','console',      'NSW-77341', 'ready',  'GSX-2'),
    ('55in Field Display',         'display',        'DSP-55210', 'in_use', 'GSX-1'),
    ('Meta Quest 3',               'vr_headset',     'MQ3-00913', 'maintenance', null),
    ('Survey Tablet A',            'tablet',         'TAB-44712', 'ready',  null),
    ('Survey Tablet B',            'tablet',         'TAB-44713', 'ready',  null),
    ('Vehicle Rack System 1',      'vehicle_rack',   'RCK-10021', 'ready',  'GSX-1'),
    ('Vehicle Rack System 2',      'vehicle_rack',   'RCK-10022', 'ready',  'GSX-2')
) as q(name, etype, serial, status, unit)
left join public.mobile_units mu on mu.call_sign = q.unit
where not exists (select 1 from public.equipment x where x.serial_number = q.serial);

-- Check-ins on the completed community event ----------------------------------------
insert into public.event_checkins (event_id, participant_id, checked_in_at, method)
select ev.id, pt.id,
       ev.starts_at + ((c.offset_mins || ' minutes')::interval), c.method
from (values
    ('P-0001', 5,  'qr'), ('P-0002', 22, 'qr'), ('P-0003', 41, 'manual'),
    ('P-0005', 63, 'qr'), ('P-0007', 88, 'qr'), ('P-0009', 110, 'roster'),
    ('P-0010', 133, 'qr'), ('P-0012', 160, 'qr')
) as c(pcode, offset_mins, method)
join public.events ev       on ev.code = 'EVT-2026-014'
join public.participants pt on pt.code = c.pcode
where not exists (
    select 1 from public.event_checkins x
    where x.event_id = ev.id and x.participant_id = pt.id
);

-- Gaze fixations: deterministic clusters around three focus zones -----------------
insert into public.gaze_fixations (session_id, x, y, duration_ms, captured_at)
select s.id,
       round((c.cx + (random() - 0.5) * 12)::numeric, 2),
       round((c.cy + (random() - 0.5) * 12)::numeric, 2),
       (120 + floor(random() * 380))::int,
       s.session_date + interval '10 minutes'
from (
    select rs.id, rs.session_date
    from public.research_sessions rs
    join public.games g on g.id = rs.game_id and g.title = 'Grid Runner'
    join public.locations l on l.id = rs.location_id and l.location_type = 'storefront'
    order by rs.session_date desc
    limit 1
) s
cross join (values (30.0, 28.0), (52.0, 45.0), (68.0, 62.0)) as c(cx, cy)
cross join generate_series(1, 12) n
where not exists (
    select 1 from public.gaze_fixations x where x.session_id = s.id
);

-- Sponsors ---------------------------------------------------------------------------
insert into public.sponsors (name, tier, contact_name, contact_email, is_prize_partner)
select sp.name, sp.tier, sp.contact, sp.email, sp.prize
from (values
    ('Buckeye Family Fun Centers', 'gold',     'Rita Meyer',   'rita@bffcenters.example', true),
    ('Columbus Parks & Rec',       'silver',   'Andre Cole',   'andre@colsrec.example',   false),
    ('Pixel Bistro',               'bronze',   'Sam Nguyen',   'sam@pixelbistro.example', true)
) as sp(name, tier, contact, email, prize)
where not exists (select 1 from public.sponsors x where x.name = sp.name);

insert into public.sponsor_packages (sponsor_id, name, ad_slots, price_cents, period_start, period_end)
select sp.id, '2026 Q4 Community Package', 3, 250000, '2026-10-01', '2026-12-31'
from public.sponsors sp
where sp.name = 'Buckeye Family Fun Centers'
  and not exists (select 1 from public.sponsor_packages x where x.sponsor_id = sp.id);

insert into public.event_sponsorships (event_id, package_id, fee_cents)
select ev.id, pk.id, 85000
from public.events ev, public.sponsor_packages pk
where ev.code = 'EVT-2026-017'
  and not exists (select 1 from public.event_sponsorships x where x.event_id = ev.id);
