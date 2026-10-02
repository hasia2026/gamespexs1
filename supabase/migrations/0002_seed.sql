-- ============================================================================
-- GAMESPEXS V1 SEED DATA — demo org, library, research activity
-- Run after 0001_gamespexs_core.sql
-- ============================================================================

-- Organization -----------------------------------------------------------------
insert into public.organizations (name, slug, org_type, website)
values ('GAMESPEXS', 'gamespexs', 'internal', 'https://gamespexs.example')
on conflict (slug) do nothing;

-- Locations --------------------------------------------------------------------
insert into public.locations (name, location_type, city, state, county)
select l.name, l.ltype, l.city, l.state, l.county
from (values
    ('GAMESPEXS Flagship Storefront', 'storefront',   'Columbus', 'OH', 'Franklin'),
    ('Linden Park Mobile Stop',       'mobile_stop',  'Columbus', 'OH', 'Franklin'),
    ('Eastmoor Community Center',     'venue',        'Columbus', 'OH', 'Franklin'),
    ('Franklin County Corrections — Closed Network', 'institutional', 'Columbus', 'OH', 'Franklin'),
    ('GAMESPEXS Research Lab',        'research_lab', 'Columbus', 'OH', 'Franklin')
) as l(name, ltype, city, state, county)
where not exists (select 1 from public.locations x where x.name = l.name);

-- People -----------------------------------------------------------------------
insert into public.people (full_name, email, person_type)
select p.full_name, p.email, p.ptype
from (values
    ('Dana Okafor', 'dana@gamespexs.example',   'researcher'),
    ('Marcus Lee',  'marcus@gamespexs.example', 'interviewer'),
    ('Priya Raman', 'priya@gamespexs.example',  'judge'),
    ('Tom Vargas',  'tom@gamespexs.example',    'community_worker'),
    ('Elena Ruiz',  'elena@gamespexs.example',  'contractor')
) as p(full_name, email, ptype)
where not exists (select 1 from public.people x where x.email = p.email);

-- Games ------------------------------------------------------------------------
insert into public.games (title, category_id, publisher, year_released, min_players, max_players, play_minutes, complexity, description)
select g.title, c.id, g.publisher, g.year, g.minp, g.maxp, g.mins, g.cx, g.descr
from (values
    ('Cohort Zero',       'Video Games',         'Closed Network Studios', 2025, 1, 1, 25, 'medium', 'Closed-network research title for institutional deployment.'),
    ('Grid Runner',       'Video Games',         'CN Studios',             2024, 1, 4, 15, 'low',    'Reaction-time runner used in engagement studies.'),
    ('Kingdoms of Ash',   'Board Games',         'TableRock',              2019, 2, 5, 90, 'high',   'Strategy board game used in group-decision research.'),
    ('Patchwork Prairie', 'Board Games',         'TableRock',              2021, 2, 4, 45, 'medium', 'Tile-laying board game.'),
    ('Skull Deck',        'Card Games',          'In-house',               2022, 2, 6, 20, 'low',    'House card game with rapid round resolution.'),
    ('Cipher Sheets',     'Paper Games',         'In-house',               2023, 1, 8, 30, 'low',    'Pencil-and-paper deduction packet.'),
    ('Bucket Line Relay', 'Sports / Team Games', 'In-house',               2020, 6, 12, 20, 'low',    'Team relay game for field events.'),
    ('The Odd Orb',       'Odd Games',           'In-house',               2024, 1, 3, 10, 'low',    'Experimental physical-dexterity game.')
) as g(title, cat, publisher, year, minp, maxp, mins, cx, descr)
join public.game_categories c on c.name = g.cat
where not exists (select 1 from public.games x where x.title = g.title);

-- Mechanics + links ------------------------------------------------------------
insert into public.game_mechanics (name, description) values
    ('Turn Order',          'Structured sequencing of player actions'),
    ('Resource Management', 'Acquiring and spending limited resources'),
    ('Reaction Time',       'Speed-of-response under stimulus'),
    ('Deduction',           'Inferring hidden information'),
    ('Cooperation',         'Joint objectives requiring coordination'),
    ('Risk Assessment',     'Choices under uncertainty')
on conflict (name) do nothing;

insert into public.game_game_mechanics (game_id, mechanic_id)
select g.id, m.id
from (values
    ('Cohort Zero',       'Reaction Time'),
    ('Cohort Zero',       'Deduction'),
    ('Grid Runner',       'Reaction Time'),
    ('Kingdoms of Ash',   'Resource Management'),
    ('Kingdoms of Ash',   'Risk Assessment'),
    ('Patchwork Prairie', 'Resource Management'),
    ('Skull Deck',        'Deduction'),
    ('Cipher Sheets',     'Deduction'),
    ('Bucket Line Relay', 'Cooperation'),
    ('The Odd Orb',       'Risk Assessment')
) as gl(game, mech)
join public.games g on g.title = gl.game
join public.game_mechanics m on m.name = gl.mech
where not exists (
    select 1 from public.game_game_mechanics x
    where x.game_id = g.id and x.mechanic_id = m.id
);

-- Studies ---------------------------------------------------------------------
insert into public.studies (organization_id, code, title, research_question, status, starts_on, ends_on, lead_person_id)
select o.id, s.code, s.title, s.rq, s.status, s.starts_on::date, s.ends_on::date, p.id
from (values
    ('GSX-2026-001', 'Engagement Baseline Study', 'Which game mechanics sustain engagement the longest?', 'active', '2026-08-01', '2026-12-31'),
    ('GSX-2026-002', 'Closed-Network Pilot',     'Can closed-network game sessions reduce reported tension in institutional settings?', 'active', '2026-09-01', '2027-02-28'),
    ('GSX-2026-003', 'Odd Games Field Trial',    'Do novel games produce higher curiosity metrics than familiar formats?', 'draft', '2026-10-15', '2027-01-31')
) as s(code, title, rq, status, starts_on, ends_on)
cross join public.organizations o
left join public.people p on p.email = 'dana@gamespexs.example'
where o.slug = 'gamespexs'
  and not exists (select 1 from public.studies x where x.code = s.code);

-- Participants ----------------------------------------------------------------
insert into public.participants (code, display_name, birth_year, gender, city, county, state, consent_given, consent_at)
select s.code, s.name, s.by, s.g, 'Columbus', 'Franklin', 'OH', true, now() - (s.d || ' days')::interval
from (values
    ('P-0001', 'Participant 1',  1998, 'F', 40),
    ('P-0002', 'Participant 2',  2001, 'M', 38),
    ('P-0003', 'Participant 3',  1995, 'F', 36),
    ('P-0004', 'Participant 4',  1987, 'M', 33),
    ('P-0005', 'Participant 5',  1979, 'F', 29),
    ('P-0006', 'Participant 6',  1993, 'M', 27),
    ('P-0007', 'Participant 7',  2004, 'F', 21),
    ('P-0008', 'Participant 8',  2000, 'M', 18),
    ('P-0009', 'Participant 9',  1996, 'M', 15),
    ('P-0010', 'Participant 10', 1988, 'F', 12),
    ('P-0011', 'Participant 11', 1972, 'M', 9),
    ('P-0012', 'Participant 12', 1999, 'F', 6),
    ('P-0013', 'Participant 13', 1991, 'M', 4),
    ('P-0014', 'Participant 14', 2003, 'F', 2)
) as s(code, name, by, g, d)
where not exists (select 1 from public.participants x where x.code = s.code);

-- Research sessions across the last ~5 weeks -----------------------------------
insert into public.research_sessions (study_id, participant_id, game_id, location_id, session_date, duration_minutes, interviewer_id, channel, status)
select st.id, pt.id, g.id, loc.id,
       now() - ((s.day_offset || ' days')::interval) + ((s.hour || ' hours')::interval),
       s.dur, iv.id, s.channel, 'complete'
from (values
    (1, 'P-0001', 'Grid Runner',   'storefront', 33, 15, 'storefront', 14),
    (2, 'P-0002', 'Kingdoms of Ash','storefront', 31, 90, 'storefront', 12),
    (3, 'P-0003', 'Grid Runner',   'storefront', 29, 14, 'storefront', 10),
    (4, 'P-0004', 'Cohort Zero',   'institutional', 27, 25, 'institutional', 9),
    (5, 'P-0005', 'Patchwork Prairie','mobile_stop', 25, 45, 'mobile_unit', 11),
    (6, 'P-0006', 'Skull Deck',    'storefront', 23, 18, 'storefront', 8),
    (7, 'P-0007', 'Cipher Sheets', 'venue',      21, 28, 'event', 12),
    (8, 'P-0008', 'Cohort Zero',   'institutional', 19, 22, 'institutional', 7),
    (9, 'P-0009', 'Grid Runner',   'storefront', 17, 13, 'storefront', 10),
    (10,'P-0010', 'The Odd Orb',   'mobile_stop', 15, 11, 'mobile_unit', 6),
    (11,'P-0011', 'Kingdoms of Ash','venue',     13, 85, 'event', 14),
    (12,'P-0012', 'Grid Runner',   'storefront', 11, 15, 'storefront', 9),
    (13,'P-0013', 'Patchwork Prairie','storefront', 9, 40, 'storefront', 11),
    (14,'P-0014', 'Skull Deck',    'mobile_stop', 7, 17, 'mobile_unit', 8),
    (15,'P-0001', 'The Odd Orb',   'storefront', 5, 12, 'storefront', 7),
    (16,'P-0004', 'Cohort Zero',   'institutional', 3, 24, 'institutional', 10),
    (17,'P-0006', 'Grid Runner',   'storefront', 2, 16, 'storefront', 9)
) as s(n, pcode, gtitle, ltype, day_offset, dur, channel, hour)
join public.studies st       on st.code = case when s.gtitle = 'Cohort Zero' then 'GSX-2026-002' else 'GSX-2026-001' end
join public.participants pt  on pt.code = s.pcode
join public.games g          on g.title = s.gtitle
join public.locations loc    on loc.location_type = s.ltype  -- one location per type in seed
left join public.people iv   on iv.email = 'marcus@gamespexs.example'
where not exists (
    select 1 from public.research_sessions x
    where x.study_id = st.id and x.participant_id = pt.id and x.game_id = g.id
      and x.session_date::date = (now() - (s.day_offset || ' days')::interval)::date
);

-- Survey + questions for the flagship study ------------------------------------
insert into public.surveys (study_id, title, description, estimated_minutes, status)
select st.id, 'Post-Session Engagement Survey', 'Blueprint-standard 10–12 minute instrument, 12 questions.', 12, 'active'
from public.studies st
where st.code = 'GSX-2026-001'
  and not exists (select 1 from public.surveys x where x.title = 'Post-Session Engagement Survey');

insert into public.survey_questions (survey_id, ordinal, prompt, question_type, options)
select sv.id, q.ordinal, q.prompt, q.qtype, to_jsonb(q.opts)
from (values
    (1,  'How fun was the game overall?',                    'likert_5',         '["Not fun","Slightly fun","Moderately fun","Very fun","Extremely fun"]'),
    (2,  'How difficult was the game to learn?',             'likert_5',         '["Very easy","Easy","Neutral","Hard","Very hard"]'),
    (3,  'How focused did you feel while playing?',          'rating_10',        '[]'),
    (4,  'Would you play this game again?',                  'boolean',          '[]'),
    (5,  'Which part did you enjoy most?',                   'multiple_choice',  '["Setup","Early game","Mid game","Endgame"]'),
    (6,  'How often do you play games like this?',           'multiple_choice',  '["Daily","Weekly","Monthly","Rarely","Never"]'),
    (7,  'Did the session hold your attention?',             'boolean',          '[]'),
    (8,  'How likely are you to recommend this game?',       'rating_10',        '[]'),
    (9,  'Was the session length appropriate?',              'likert_5',         '["Much too short","Too short","Right length","Too long","Much too long"]'),
    (10, 'Did you feel time pass quickly?',                  'likert_5',         '["Not at all","Slightly","Moderately","Mostly","Completely"]'),
    (11, 'What would you change about the game?',            'free_text',        '[]'),
    (12, 'Any other comments?',                              'free_text',        '[]')
) as q(ordinal, prompt, qtype, opts)
join public.surveys sv on sv.title = 'Post-Session Engagement Survey'
where not exists (
    select 1 from public.survey_questions x
    where x.survey_id = sv.id and x.ordinal = q.ordinal
);

-- Survey responses for completed sessions --------------------------------------
insert into public.survey_responses (session_id, question_id, response_value, answered_at)
select sess.id, qq.id,
       case qq.question_type
           when 'likert_5'        then to_jsonb(1 + floor(random() * 5)::int)
           when 'rating_10'       then to_jsonb(1 + floor(random() * 10)::int)
           when 'boolean'         then to_jsonb(random() < 0.7)
           else to_jsonb('Automated seed comment for research demonstration purposes.'::text)
       end,
       sess.session_date + interval '45 minutes'
from public.surveys sv
join public.survey_questions qq on qq.survey_id = sv.id
join public.research_sessions sess on sess.study_id = sv.study_id and sess.status = 'complete'
where sv.title = 'Post-Session Engagement Survey'
  and qq.question_type not in ('multiple_choice','likert_5')
  and not exists (
      select 1 from public.survey_responses x
      where x.session_id = sess.id and x.question_id = qq.id
  );

-- multiple_choice separately (single random option per row)
insert into public.survey_responses (session_id, question_id, response_value, answered_at)
select sess.id, qq.id,
       to_jsonb(opts.opt),
       sess.session_date + interval '45 minutes'
from public.surveys sv
join public.survey_questions qq on qq.survey_id = sv.id
join public.research_sessions sess on sess.study_id = sv.study_id and sess.status = 'complete'
cross join lateral (
    select jsonb_array_elements_text(qq.options) as opt
    offset floor(random() * jsonb_array_length(qq.options))
    limit 1
) opts
where sv.title = 'Post-Session Engagement Survey'
  and qq.question_type = 'multiple_choice'
  and not exists (
      select 1 from public.survey_responses x
      where x.session_id = sess.id and x.question_id = qq.id
  );

-- likert_5 answers must be the option labels (matches app distribution logic)
insert into public.survey_responses (session_id, question_id, response_value, answered_at)
select sess.id, qq.id,
       to_jsonb(opts.opt),
       sess.session_date + interval '45 minutes'
from public.surveys sv
join public.survey_questions qq on qq.survey_id = sv.id
join public.research_sessions sess on sess.study_id = sv.study_id and sess.status = 'complete'
cross join lateral (
    select jsonb_array_elements_text(qq.options) as opt
    offset floor(random() * jsonb_array_length(qq.options))
    limit 1
) opts
where sv.title = 'Post-Session Engagement Survey'
  and qq.question_type = 'likert_5'
  and not exists (
      select 1 from public.survey_responses x
      where x.session_id = sess.id and x.question_id = qq.id
  );

-- Session metrics: engagement, reaction, gaze fixations, heatmap density -------
insert into public.session_metrics (session_id, metric_key, metric_value, unit, captured_at, source)
select sess.id, m.key, m.val, m.unit, sess.session_date + (m.mins || ' minutes')::interval, m.src
from public.research_sessions sess
cross join (values
    ('engagement_score',    6.0,  9.5, 'index',        'manual'),
    ('reaction_time_ms',    280,  520, 'ms',           'game_log'),
    ('gaze_fixation_count', 40,   120, 'count',        'eye_tracker'),
    ('heatmap_density',     0.2,  0.9, 'ratio',        'eye_tracker'),
    ('persistence_events',  2,    18,  'count',        'game_log')
) as m(key, lo, hi, unit, src)
where sess.status = 'complete'
  and not exists (
      select 1 from public.session_metrics x
      where x.session_id = sess.id and x.metric_key = m.key
  );

update public.session_metrics
set metric_value = round((m.lo + random() * (m.hi - m.lo))::numeric, 2)
from (values
    ('engagement_score',    6.0,  9.5),
    ('reaction_time_ms',    280,  520),
    ('gaze_fixation_count', 40,   120),
    ('heatmap_density',     0.2,  0.9),
    ('persistence_events',  2,    18)
) as m(key, lo, hi)
where session_metrics.metric_key = m.key
  and session_metrics.metric_value = 0;

-- A finding + a draft report ---------------------------------------------------
insert into public.research_findings (study_id, title, summary, confidence)
select st.id, 'Reaction mechanics drive repeat engagement', 'Sessions featuring reaction-time mechanics averaged higher engagement scores and more persistence events.', 'supported'
from public.studies st
where st.code = 'GSX-2026-001'
  and not exists (select 1 from public.research_findings x where x.title = 'Reaction mechanics drive repeat engagement');

insert into public.research_reports (study_id, title, body_md, status)
select st.id, 'Interim Report — Engagement Baseline (Q3)', '# Interim Report — Engagement Baseline (Q3)

## Method
Seventeen research sessions across storefront, mobile-unit, and institutional channels.

## Preliminary findings
Reaction-mechanic games showed the strongest engagement persistence.

## Next steps
Extend the participant pool and attach full eye-tracking sessions.', 'draft'
from public.studies st
where st.code = 'GSX-2026-001'
  and not exists (select 1 from public.research_reports x where x.title = 'Interim Report — Engagement Baseline (Q3)');
