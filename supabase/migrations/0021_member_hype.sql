-- ============================================================================
-- 0021 — MEMBER Hype: showcase consent + hype summary RPC (Steve phase-two)
-- ----------------------------------------------------------------------------
-- Steve's blueprint: a mandatory YES/NO gate before any member rating can be
-- showcased, defaulting to NULL (never pre-selected):
--   YES -> profile flagged public-authorized (ratings may be showcased)
--   NO  -> strictly local-private (ratings stay on the member's own screen)
-- Plus "My Hype Summary": total ratings logged, favorite genre, and the last
-- 15 ratings for quick review.
-- ============================================================================

alter table public.members
    add column if not exists rating_showcase text
        check (rating_showcase in ('public', 'private'));

comment on column public.members.rating_showcase is
    'Showcase consent for 5-star ratings (Steve phase-two): NULL = not answered yet, ''public'' = may showcase under anonymous identity, ''private'' = strictly local-reported.';

-- Consent setter: members may set their own choice exactly once resolved and
-- can change it later. Scoped by auth.uid() through the members row.
create or replace function public.set_rating_showcase(p_choice text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_member public.members;
begin
    if p_choice not in ('public', 'private') then
        return jsonb_build_object('ok', false, 'error', 'Choose YES (public) or NO (private).');
    end if;

    select * into v_member from public.members
    where auth_user_id = auth.uid();

    if not found then
        return jsonb_build_object('ok', false, 'error', 'No member profile found.');
    end if;

    update public.members
    set rating_showcase = p_choice, updated_at = now()
    where id = v_member.id;

    return jsonb_build_object('ok', true, 'rating_showcase', p_choice);
end;
$$;

-- Hype summary: totals + favorite quadrant + the last 15 logged ratings.
create or replace function public.member_hype()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_member public.members;
    v_total integer;
    v_favorite text;
    v_recent jsonb;
begin
    select * into v_member from public.members
    where auth_user_id = auth.uid();

    if not found then
        return jsonb_build_object('ok', false, 'error', 'No member profile found.');
    end if;

    select count(*) into v_total
    from public.catalog_ratings where member_id = v_member.id;

    -- Favorite genre: the quadrant the member rated most (ties -> most recent).
    select q.label into v_favorite
    from public.catalog_ratings r
    join public.quadrants q on q.code = r.quadrant
    where r.member_id = v_member.id
    group by q.label
    order by count(*) desc, max(r.updated_at) desc
    limit 1;

    select coalesce(jsonb_agg(jsonb_build_object(
        'game_id',    g.id,
        'title',      g.title,
        'stars',      r.stars,
        'quadrant',   r.quadrant,
        'rated_at',   r.updated_at
    ) order by r.updated_at desc), '[]'::jsonb)
    into v_recent
    from (
        select * from public.catalog_ratings
        where member_id = v_member.id
        order by updated_at desc
        limit 15
    ) r
    join public.games g on g.id = r.game_id;

    return jsonb_build_object(
        'ok', true,
        'total_ratings', v_total,
        'favorite_genre', v_favorite,
        'rating_showcase', v_member.rating_showcase,
        'recent', v_recent
    );
end;
$$;
