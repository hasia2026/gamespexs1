-- ============================================================================
-- 0020 — LAUNCH LIBRARY: Steve's 75-question star bank + MASTER GENRE TAXONOMY
-- ----------------------------------------------------------------------------
-- 1) Relax the V1 blueprint caps so a 75-question launch instrument can exist:
--      * surveys.estimated_minutes       10..12  ->  5..120
--      * surveys.question_limit          15      ->  150
--      * survey_questions.ordinal        1..15   ->  1..150
--      * enforce_survey_question_cap()   15      ->  150
--    The original Post-Session Engagement Survey keeps its own 12-question /
--    12-minute shape; nothing about existing surveys changes.
--
-- 2) Master genre taxonomy (Steve directive): game_categories gains a parent
--    genre concept. The 10 PRIMARY genres stay categories; the ~40 sub-genres
--    from the Master Genre Database are appended to the category descriptions
--    so the Categories page becomes the visible "master taxonomy".
--
-- 3) New active survey "GAMESPEXS Launch Library" (Set 1-5, 75 questions,
--    one-at-a-time star ratings under a new star_5 question type) plus a
--    matching launch study so admins can schedule sessions against it.
--
-- 4) Tablet rule fix: the slot-8 favorite_sports_team mapping in
--    survey_question_custom_slot() would mislabel ordinal 8 of the new bank;
--    the mapping is now narrowly scoped to the Post-Session Engagement Survey.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Relax the blueprint caps
-- ----------------------------------------------------------------------------
alter table public.surveys
    drop constraint if exists surveys_estimated_minutes_check;
alter table public.surveys
    add constraint surveys_estimated_minutes_check
        check (estimated_minutes between 5 and 120);

alter table public.survey_questions
    drop constraint if exists survey_questions_ordinal_check;
alter table public.survey_questions
    add constraint survey_questions_ordinal_check
        check (ordinal between 1 and 150);

create or replace function public.enforce_survey_question_cap()
returns trigger as $$
declare
    n integer;
begin
    select count(*) into n from public.survey_questions where survey_id = new.survey_id;
    if n > 150 then
        raise exception 'Surveys are capped at 150 questions (V2 launch limit).';
    end if;
    return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 2. Master genre taxonomy (10 primary genres + subgenre notes)
-- ----------------------------------------------------------------------------
-- Subgenre lists are appended into the descriptions so the existing
-- game_categories table carries the whole taxonomy — no schema churn.

update public.game_categories set description =
    'Digital immersive experiences. Subgenres: Action & Combat (FPS, fighting, hack-and-slash, beat-''em-ups); Adventure & Narrative (point-and-click, visual novels, interactive dramas); RPG (tactical, open-world action, turn-based fantasy); Strategy & Tactics (RTS, TBS, tower defense, grand strategy); Simulation & Sandbox (city builders, life sims, vehicle sims, voxel building); Sports & Racing; Puzzle & Logic (physics, tile-matching, trivia, hidden-object); Platformers (2D/3D precision, side-scrollers, runners); Survival & Horror (crafting survival, psychological thrillers, escape games).'
where name = 'Video Games';

update public.game_categories set description =
    'Tabletop strategy, resource-gathering, and thematic family games. Subgenres: Abstract Strategy (zero-luck positioning like chess); Eurogames (resource and economic engines, low conflict); Ameritrash / Thematic (high-conflict dice, cards, story); Party & Social Deduction (hidden roles, acting, voting); Cooperative Tabletop (all players vs. the board); Deckbuilding & Engine Builders; Roll-and-Write; Dexterity & Physical (steady hands, stacking, flicking, balance).'
where name = 'Board Games';

update public.game_categories set description =
    'Trick-taking decks, collectible trading card systems, and quick casual matching. Subgenres: Classic Card Games (standard multi-suit deck); Trading Card Games / Collectible (collect, trade, duel); Fast-Paced Shedding Games (casual color and action shedding).'
where name = 'Card Games';

-- "Sports / Team Games" splits into the taxonomy's three ball-sport primaries.
insert into public.game_categories (name, description)
select 'Invasion Ball Games',
    'Team sports focused on invading territory to score (basketball, soccer, football). Subgenre: Invasion Games.'
where not exists (select 1 from public.game_categories where name = 'Invasion Ball Games');

-- NOTE: the legacy "Sports / Team Games" row folds into Invasion Ball Games
-- at the end of this section.

insert into public.game_categories (name, description)
select 'Net & Wall Games',
    'Objects sent over a net or against a wall to prevent a return (volleyball, tennis). Subgenre: Net & Wall Games.'
where not exists (select 1 from public.game_categories where name = 'Net & Wall Games');

insert into public.game_categories (name, description)
select 'Target & Precision Sports',
    'Hitting specific targets with extreme accuracy (bowling, archery). Subgenres: Target & Precision; Striking & Fielding (baseball-style hit-and-run).'
where not exists (select 1 from public.game_categories where name = 'Target & Precision Sports');

insert into public.game_categories (name, description)
select 'Cue Sports',
    'Table-based precision games striking balls with a cue into pockets (billiards, pool).'
where not exists (select 1 from public.game_categories where name = 'Cue Sports');

-- "Paper Games" keeps its name; absorb the taxonomy's paper subgenres.
update public.game_categories set description =
    'Grid-based, word-deduction, and turn-based games played on paper. Subgenres: Grid & Capture (dots and boxes); Word & Letter Deduction (hangman); Combat & Fleet Guessing (battleship grids); Paper Adventure & Mazes; Abstract Paper Strategy (tic-tac-toe, sprout); Combinatorial Number Puzzles (Sudoku); Cryptic & Cypher Deduction.'
where name = 'Paper Games';

insert into public.game_categories (name, description)
select 'Simulation & Role-Playing Games',
    'Deep world-building, creative sandbox choices, and character growth across tabletop and digital.'
where not exists (select 1 from public.game_categories where name = 'Simulation & Role-Playing Games');

insert into public.game_categories (name, description)
select 'Odd Games & Custom Rules',
    'Unconventional play with specialized local guidelines, unique props, or creative challenges. Includes yard games (horseshoes, cornhole, bocce), tag & chasing, parachute group games, rhythm & audio timing, pinball & mechanical ball physics, and light-gun target tracking.'
where not exists (select 1 from public.game_categories where name = 'Odd Games & Custom Rules');

-- Legacy rows fold into the taxonomy names when both exist:
--   "Odd Games" -> "Odd Games & Custom Rules"
--   "Sports / Team Games" -> "Invasion Ball Games"
update public.games g
set category_id = n.id
from public.game_categories l
join public.game_categories n on n.name = 'Odd Games & Custom Rules'
where l.name = 'Odd Games' and g.category_id = l.id
  and exists (select 1 from public.game_categories where name = 'Odd Games & Custom Rules')
  and exists (select 1 from public.game_categories where name = 'Odd Games');

delete from public.game_categories
where name = 'Odd Games'
  and exists (select 1 from public.game_categories where name = 'Odd Games & Custom Rules');

update public.games g
set category_id = n.id
from public.game_categories l
join public.game_categories n on n.name = 'Invasion Ball Games'
where l.name = 'Sports / Team Games' and g.category_id = l.id;

delete from public.game_categories
where name = 'Sports / Team Games'
  and exists (select 1 from public.game_categories where name = 'Invasion Ball Games');

-- ----------------------------------------------------------------------------
-- 3. New question type: star_5 (1-5 star ratings, stored as integer)
-- ----------------------------------------------------------------------------
alter table public.survey_questions
    drop constraint if exists survey_questions_question_type_check;
alter table public.survey_questions
    add constraint survey_questions_question_type_check
        check (question_type in
            ('likert_5','multiple_choice','free_text','boolean','rating_10','ranking','star_5'));

-- ----------------------------------------------------------------------------
-- 4. Launch study + the 75-question Launch Library survey
-- ----------------------------------------------------------------------------
insert into public.studies (organization_id, code, title, research_question, status, starts_on, ends_on)
select o.id, 'GSX-2026-010',
    'Launch Library Baseline',
    'Do the launch-wide star ratings (master genre + play-habit banks) reveal distinct genre passion per member bubble?',
    'active', '2026-10-01', '2027-10-01'
from public.organizations o
where o.slug = 'gamespexs'
  and not exists (select 1 from public.studies where code = 'GSX-2026-010');

insert into public.surveys (study_id, title, description, estimated_minutes, question_limit, status)
select st.id,
    'GAMESPEXS Launch Library',
    'Steve''s phase-two launch bank: 75 one-at-a-time star questions across modern releases, specific game elements, activity tracking, playstyles, and spectating habits.',
    45, 200, 'active'
from public.studies st
where st.code = 'GSX-2026-010'
  and not exists (select 1 from public.surveys where title = 'GAMESPEXS Launch Library');

-- All 75 prompts. SET 1: modern releases & broad genre hype (1-15)
-- Tablet sequencing rule: Sets 1-2 (modern-game + specific-game reflections)
-- run first as post_game; Sets 3-5 (activity, playstyle, spectating) are
-- play-history fields and show after.
insert into public.survey_questions (survey_id, ordinal, prompt, question_type, options, phase)
select sv.id, q.ord, q.prompt, 'star_5', '[]'::jsonb,
       case when q.ord >= 31 then 'play_history' else 'post_game' end
from (values
    (1 , 'How would you rate the overall quality of the biggest game releases out this year?'),
    (2 , 'Rate the level of pure excitement and hype surrounding current multiplayer team games!'),
    (3 , 'How would you rate the storytelling or narrative depth in modern adventure games?'),
    (4 , 'Rate the satisfaction level and strategic depth found in current strategy game genres.'),
    (5 , 'How high would you rate the tension and pacing in modern action or survival genres?'),
    (6 , 'Rate the learning curve of today''s casual puzzle games—are they easy to pick up and play?'),
    (7 , 'How would you rate the visual style, art design, and graphics of modern game releases?'),
    (8 , 'Rate the level of community teamwork and cooperation required in today''s co-op genres.'),
    (9 , 'How would you rate the nostalgia or classic charm found in current retro-style indie games?'),
    (10, 'Rate the competitive fairness and balance in modern sports or tactical team games.'),
    (11, 'How would you rate the level of freedom and discovery in today''s open-environment genres?'),
    (12, 'Rate the audio design, music soundtracks, and voice acting in modern game releases.'),
    (13, 'How would you rate the replay value—how eager are you to replay current game titles?'),
    (14, 'Rate the innovation—how fresh or unique do modern game mechanics feel right now?'),
    (15, 'How would you rate your overall preference for modern digital games compared to classic physical games?'),
    -- SET 2: specific game elements, no brand names (16-30)
    (16, 'How would you rate the overall "fun factor" of this game when playing with a group?'),
    (17, 'Rate the level of teamwork or cooperation required to win this game!'),
    (18, 'How high is the usual tension or hype during the peak moments of this game?'),
    (19, 'Rate how friendly or casual the vibes are when introducing this game to beginners.'),
    (20, 'How would you rate the immersion—is this a game where you easily lose track of time?'),
    (21, 'Rate the satisfaction level of pulling off a successful strategy or winning play in this game!'),
    (22, 'How would you rate the potential for laugh-out-loud or hilarious moments during a match?'),
    (23, 'Rate the comeback potential—does this game keep things close until the very end?'),
    (24, 'How would you rate the skill level required to truly master this game''s mechanics?'),
    (25, 'Rate the level of social connection and interaction this game naturally creates between players.'),
    (26, 'How would you rate the visual design, art style, or overall look of this game?'),
    (27, 'Rate the learning curve—how easy is it to pick up and understand on the very first try?'),
    (28, 'How much classic nostalgia or timeless charm does this game bring to the table?'),
    (29, 'Rate the final scoring or victory conditions—how satisfying is the ultimate conclusion?'),
    (30, 'How would you rate your overall desire to recommend this game to a friend looking for something new?'),
    -- SET 3: activity & involvement tracking (31-45)
    (31, 'How much do you enjoy playing basketball?'),
    (32, 'How much do you enjoy watching basketball matches?'),
    (33, 'How would you rate your overall love for playing video games?'),
    (34, 'How much do you enjoy watching video game streams or tournaments?'),
    (35, 'How would you rate your overall enjoyment of playing board games?'),
    (36, 'How much do you enjoy watching competitive or casual board game play?'),
    (37, 'How much do you enjoy playing billiards or pool?'),
    (38, 'How much do you enjoy watching skilled billiards or trick-shot matches?'),
    (39, 'How much do you enjoy playing tennis?'),
    (40, 'How much do you enjoy watching professional tennis matches?'),
    (41, 'How much do you enjoy playing volleyball games?'),
    (42, 'How much do you enjoy watching live volleyball matches?'),
    (43, 'How would you rate your interest in playing quick, casual party games?'),
    (44, 'How would you rate your interest in watching large-group interactive games?'),
    (45, 'How eager are you to discover entirely new categories of games to play or watch?'),
    -- SET 4: playstyles & tactical elements (46-60)
    (46, 'How much do you enjoy playing fast-paced team games?'),
    (47, 'How much do you enjoy watching strategic team games?'),
    (48, 'How would you rate your interest in playing traditional turn-based games?'),
    (49, 'How much do you enjoy watching high-stakes competitive matches?'),
    (50, 'How would you rate your enjoyment of playing precision or target-based games?'),
    (51, 'How much do you enjoy watching skilled precision or trick-shot demonstrations?'),
    (52, 'How would you rate your interest in playing local, couch-cooperative games?'),
    (53, 'How much do you enjoy watching analytical or puzzle-solving games?'),
    (54, 'How much do you enjoy playing large-scale interactive group games?'),
    (55, 'How would you rate your interest in watching fast-reflex or athletic games?'),
    (56, 'How would you rate your enjoyment of playing classic tile or token placement games?'),
    (57, 'How much do you enjoy watching casual, fun-first exhibitions?'),
    (58, 'How eager are you to try out new styles of competitive strategy games?'),
    (59, 'How would you rate your preference for watching games with a live crowd or audience?'),
    (60, 'How much do you enjoy tracking or following performance statistics in games?'),
    -- SET 5: play habits & spectating preferences (61-75)
    (61, 'How much do you enjoy playing games that require quick decision-making under a timer?'),
    (62, 'How much do you enjoy watching games where commentators break down the strategies?'),
    (63, 'How would you rate your interest in playing cooperative games where everyone wins together?'),
    (64, 'How much do you enjoy watching high-energy, fast-moving match highlights?'),
    (65, 'How would you rate your interest in playing games that rely purely on luck and chance?'),
    (66, 'How much do you enjoy watching a master of a specific game demonstrate their skill?'),
    (67, 'How would you rate your interest in playing hidden-information or mystery games?'),
    (68, 'How much do you enjoy watching games that have a massive, dramatic final conclusion?'),
    (69, 'How would you rate your enjoyment of playing games with simple, straightforward rule sets?'),
    (70, 'How much do you enjoy watching rivalries or close matches between top-tier competitors?'),
    (71, 'How would you rate your interest in playing games that use physical pieces, cards, or tokens?'),
    (72, 'How much do you enjoy watching casual, stress-free games played just for laughs?'),
    (73, 'How would you rate your preference for playing games in short, quick bursts?'),
    (74, 'How much do you enjoy spectating or watching games alongside a group of friends?'),
    (75, 'How eager are you to rate and review different styles of games that you discover?')
) as q(ord, prompt)
join public.surveys sv on sv.title = 'GAMESPEXS Launch Library'
where not exists (
    select 1 from public.survey_questions x
    where x.survey_id = sv.id and x.ordinal = q.ord
);

-- ----------------------------------------------------------------------------
-- 5. Tablet rules: scope slot-8 favorite_sports_team to the Post-Session
--    Engagement Survey so the Launch Library's ordinal 8 (co-op teamwork)
--    keeps its own prompt.
-- ----------------------------------------------------------------------------
create or replace function public.survey_question_custom_slot()
returns trigger
language plpgsql
as $$
declare
    v_post_session uuid;
begin
    select id into v_post_session
    from public.surveys where title = 'Post-Session Engagement Survey' limit 1;

    new.custom_slot :=
        case when new.ordinal = 8
              and new.survey_id is not distinct from v_post_session
             then 'favorite_sports_team' else null end;
    return new;
end;
$$;

-- Backfill: clear the mapping everywhere except the Post-Session survey.
update public.survey_questions q
set custom_slot = case
    when q.ordinal = 8
     and q.survey_id = (select id from public.surveys where title = 'Post-Session Engagement Survey' limit 1)
    then 'favorite_sports_team'
    else null end;
