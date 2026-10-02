-- 0013: Member dashboard — founding leaderboard + sponsor shout-out ticker.
-- Applied live as migration `member_leaderboard_shoutouts` (verified in prosrc).

-- Founding-1,000 scarcity: lowest / earliest Player Numbers + total member count.
-- Definer because members can only read their own row via RLS.
-- Identity masking (addendum Q2): no first_name — public identity is [Last Initial] + [Color].
create or replace function public.founding_leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'member_count', (select count(*) from public.members where player_number is not null),
        'founding_capacity', 1000,
        'leaders', coalesce(
            (select jsonb_agg(jsonb_build_object(
                'player_number', m.player_number,
                'last_initial', m.last_initial,
                'signature_color_1', m.signature_color_1,
                'tier', m.tier
            ) order by m.player_number)
            from (select * from public.members where player_number is not null order by player_number asc limit 10) m
            ), '[]'::jsonb)
    );
$$;

-- Sponsor shout-out ticker: total brand-mention tally per sponsor.
-- brand_mentions SELECT is staff-only via RLS, so members get an
-- aggregate-only view through this definer RPC (no phrases/rows exposed).
create or replace function public.sponsor_shoutouts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(jsonb_build_object(
            'sponsor_id', t.sponsor_id,
            'name', t.name,
            'tier', t.tier,
            'is_prize_partner', t.is_prize_partner,
            'mention_count', t.mention_count
        ) order by t.mention_count desc, t.name asc),
        '[]'::jsonb
    )
    from (
        select s.id as sponsor_id, s.name, s.tier, s.is_prize_partner,
               (select count(*) from public.brand_mentions bm where bm.sponsor_id = s.id) as mention_count
        from public.sponsors s
    ) t;
$$;

grant execute on function public.founding_leaderboard() to authenticated;
grant execute on function public.sponsor_shoutouts() to authenticated;
