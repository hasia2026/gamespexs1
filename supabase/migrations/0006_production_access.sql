-- ============================================================================
-- 0006 — PRODUCTION ACCESS BASELINE
-- Run after migrations 0001–0005. Replaces permissive authenticated-user RLS
-- with active-profile, role-based policies. This is a single-organization
-- baseline; organization-isolated multi-tenancy still needs a separate design.
-- ============================================================================

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active = true
  );
$$;

create or replace function public.has_app_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and p.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_active_app_user() from public, anon;
revoke all on function public.has_app_role(text[]) from public, anon;
grant execute on function public.is_active_app_user() to authenticated;
grant execute on function public.has_app_role(text[]) to authenticated;

-- Profiles are provisioned by trusted administrators, never by self-service
-- role/organization updates. Users can only update their own display name.
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
  for select to authenticated
  using (
    public.is_active_app_user()
    and (
      id = (select auth.uid())
      or public.has_app_role(array['admin','executive'])
    )
  );
create policy profiles_update_own_name on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and public.is_active_app_user())
  with check (id = (select auth.uid()) and public.is_active_app_user());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Remove the starter policies (including generated Phase 3 policies).
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'organizations','locations','people','game_categories','games',
        'game_mechanics','game_game_mechanics','studies','participants',
        'research_sessions','surveys','survey_questions','survey_responses',
        'session_metrics','research_findings','research_reports','audit_log',
        'mobile_units','routes','route_stops','events','field_teams',
        'field_team_members','event_team_assignments','equipment',
        'event_checkins','gaze_fixations','sponsors','sponsor_packages',
        'event_sponsorships','brand_mentions'
      ])
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Foundation and game library -----------------------------------------------
create policy organizations_read on public.organizations
  for select to authenticated using (
    public.is_active_app_user() and public.has_app_role(array['admin','executive'])
  );
create policy locations_read on public.locations
  for select to authenticated using (public.is_active_app_user());
create policy locations_write on public.locations
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy people_read on public.people
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge'])
  );
create policy people_write on public.people
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy game_categories_read on public.game_categories
  for select to authenticated using (public.is_active_app_user());
create policy game_categories_admin_write on public.game_categories
  for all to authenticated using (public.has_app_role(array['admin']))
  with check (public.has_app_role(array['admin']));
create policy games_read on public.games
  for select to authenticated using (public.is_active_app_user());
create policy games_write on public.games
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy game_mechanics_read on public.game_mechanics
  for select to authenticated using (public.is_active_app_user());
create policy game_mechanics_admin_write on public.game_mechanics
  for all to authenticated using (public.has_app_role(array['admin']))
  with check (public.has_app_role(array['admin']));
create policy game_game_mechanics_read on public.game_game_mechanics
  for select to authenticated using (public.is_active_app_user());
create policy game_game_mechanics_write on public.game_game_mechanics
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );

-- Research records ------------------------------------------------------------
create policy studies_read on public.studies
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge','viewer'])
  );
create policy studies_write on public.studies
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy participants_read on public.participants
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge'])
  );
create policy participants_insert on public.participants
  for insert to authenticated with check (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  );
create policy participants_update on public.participants
  for update to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy participants_delete on public.participants
  for delete to authenticated using (public.has_app_role(array['admin']));
create policy research_sessions_read on public.research_sessions
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge','viewer'])
  );
create policy research_sessions_write on public.research_sessions
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  );
create policy surveys_read on public.surveys
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge','viewer'])
  );
create policy surveys_write on public.surveys
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy survey_questions_read on public.survey_questions
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer','judge','viewer'])
  );
create policy survey_questions_write on public.survey_questions
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy survey_responses_read on public.survey_responses
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy survey_responses_insert on public.survey_responses
  for insert to authenticated with check (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  );
create policy survey_responses_admin_delete on public.survey_responses
  for delete to authenticated using (public.has_app_role(array['admin']));
create policy session_metrics_read on public.session_metrics
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  );
create policy session_metrics_insert on public.session_metrics
  for insert to authenticated with check (
    public.has_app_role(array['admin','executive','researcher','field_operator','interviewer'])
  );
create policy session_metrics_admin_write on public.session_metrics
  for update to authenticated using (public.has_app_role(array['admin']))
  with check (public.has_app_role(array['admin']));
create policy session_metrics_admin_delete on public.session_metrics
  for delete to authenticated using (public.has_app_role(array['admin']));
create policy findings_read on public.research_findings
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','viewer'])
  );
create policy findings_write on public.research_findings
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy reports_read on public.research_reports
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher','viewer'])
  );
create policy reports_write on public.research_reports
  for all to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  ) with check (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy audit_log_read on public.audit_log
  for select to authenticated using (
    public.has_app_role(array['admin','executive'])
  );

-- Field operations ------------------------------------------------------------
create policy mobile_units_read on public.mobile_units
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy mobile_units_write on public.mobile_units
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy routes_read on public.routes
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy routes_write on public.routes
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy route_stops_read on public.route_stops
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy route_stops_write on public.route_stops
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy events_read on public.events
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge','sponsor_manager','researcher','viewer'])
  );
create policy events_write on public.events
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy field_teams_read on public.field_teams
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy field_teams_write on public.field_teams
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy field_team_members_read on public.field_team_members
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy field_team_members_write on public.field_team_members
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy event_team_assignments_read on public.event_team_assignments
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy event_team_assignments_write on public.event_team_assignments
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy equipment_read on public.equipment
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy equipment_write on public.equipment
  for all to authenticated using (
    public.has_app_role(array['admin','executive','field_operator'])
  ) with check (
    public.has_app_role(array['admin','executive','field_operator'])
  );
create policy event_checkins_read on public.event_checkins
  for select to authenticated using (
    public.has_app_role(array['admin','executive','field_operator','judge','researcher'])
  );
create policy event_checkins_insert on public.event_checkins
  for insert to authenticated with check (
    public.has_app_role(array['admin','executive','field_operator','judge'])
  );
create policy event_checkins_admin_delete on public.event_checkins
  for delete to authenticated using (public.has_app_role(array['admin']));
create policy gaze_fixations_read on public.gaze_fixations
  for select to authenticated using (
    public.has_app_role(array['admin','executive','researcher'])
  );
create policy gaze_fixations_insert on public.gaze_fixations
  for insert to authenticated with check (
    public.has_app_role(array['admin','researcher'])
  );
create policy gaze_fixations_admin_delete on public.gaze_fixations
  for delete to authenticated using (public.has_app_role(array['admin']));

-- Sponsor records -------------------------------------------------------------
create policy sponsors_read on public.sponsors
  for select to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager','field_operator'])
  );
create policy sponsors_write on public.sponsors
  for all to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  ) with check (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  );
create policy sponsor_packages_read on public.sponsor_packages
  for select to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager','field_operator'])
  );
create policy sponsor_packages_write on public.sponsor_packages
  for all to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  ) with check (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  );
create policy event_sponsorships_read on public.event_sponsorships
  for select to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager','field_operator'])
  );
create policy event_sponsorships_write on public.event_sponsorships
  for all to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  ) with check (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  );
create policy brand_mentions_read on public.brand_mentions
  for select to authenticated using (
    public.has_app_role(array['admin','executive','sponsor_manager'])
  );
create policy brand_mentions_insert on public.brand_mentions
  for insert to authenticated with check (
    public.has_app_role(array['admin','executive','sponsor_manager','field_operator'])
  );
create policy brand_mentions_admin_update on public.brand_mentions
  for update to authenticated using (public.has_app_role(array['admin']))
  with check (public.has_app_role(array['admin']));
create policy brand_mentions_admin_delete on public.brand_mentions
  for delete to authenticated using (public.has_app_role(array['admin']));

-- Harden SECURITY DEFINER entry points and prevent anonymous dashboard reads.
create or replace function public.dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_active_app_user() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return json_build_object(
    'active_studies', (select count(*) from public.studies where status = 'active'),
    'total_participants', (select count(*) from public.participants),
    'sessions_this_month', (select count(*) from public.research_sessions where session_date >= date_trunc('month', now())),
    'sessions_total', (select count(*) from public.research_sessions),
    'games_tracked', (select count(*) from public.games where is_active),
    'responses_captured', (select count(*) from public.survey_responses),
    'metrics_captured', (select count(*) from public.session_metrics),
    'people_count', (select count(*) from public.people where is_active),
    'locations_count', (select count(*) from public.locations where is_active)
  );
end;
$$;
revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  rec jsonb;
begin
  rec := to_jsonb(coalesce(new, old));
  insert into public.audit_log (actor_id, table_name, record_id, action, changes)
  values (
    actor,
    tg_table_name,
    rec ->> 'id',
    tg_op,
    case tg_op
      when 'DELETE' then to_jsonb(old)
      else jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old))
    end
  );
  return coalesce(new, old);
end;
$$;
revoke all on function public.audit_row() from public, anon, authenticated;
