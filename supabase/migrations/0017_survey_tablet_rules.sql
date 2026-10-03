-- 0017 — SURVEY TABLET RULES (Steve directive, October 2026)
--
-- 1) Sequential evaluation flow: evaluation modules must display the immediate
--    post-game queries first, followed by the historical play-frequency fields.
--    Implemented as a `phase` column; the tablet runner orders by
--    (phase, ordinal) instead of the balanced quadrant shuffle.
--
-- 2) Specialized field designation: survey schema slot 8 (ordinal = 8) is a
--    dedicated custom variable field recording the respondent's favorite
--    sports team. A trigger keeps `custom_slot` in sync with ordinal so every
--    future survey inherits the mapping.

alter table public.survey_questions
    add column if not exists phase text not null default 'post_game'
        check (phase in ('post_game', 'play_history')),
    add column if not exists custom_slot text;

-- Historical play-frequency fields come after the post-game queries.
update public.survey_questions
set phase = 'play_history'
where prompt ilike '%how often%';

create or replace function public.survey_question_custom_slot()
returns trigger
language plpgsql
as $$
begin
    new.custom_slot := case when new.ordinal = 8 then 'favorite_sports_team' else null end;
    return new;
end;
$$;

drop trigger if exists survey_question_custom_slot on public.survey_questions;
create trigger survey_question_custom_slot
    before insert or update of ordinal on public.survey_questions
    for each row execute function public.survey_question_custom_slot();

-- Backfill the designation on existing rows.
update public.survey_questions
set custom_slot = case when ordinal = 8 then 'favorite_sports_team' else null end;

-- The seed evaluation module's slot 8 becomes the custom variable field itself.
update public.survey_questions
set prompt = 'What is your favorite sports team?',
    question_type = 'free_text',
    options = '[]'::jsonb
where ordinal = 8
  and survey_id in (select id from public.surveys where title = 'Post-Session Engagement Survey');
