import { notFound } from "next/navigation";
import { getQuestions, getSessionDetail, getSurveys } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import SurveyRunner from "@/components/SurveyRunner";
import type { SurveyQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SurveyRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSessionDetail(id);
  if (!detail) notFound();

  const surveys = await getSurveys();
  const survey =
    surveys.find((s) => s.study_id === detail.session.study_id && s.status === "active") ??
    surveys.find((s) => s.status === "active") ??
    surveys[0];
  if (!survey) notFound();

  // Quadrant-balanced routing: shuffled round-robin across Q1–Q4 (blueprint matrix).
  // Falls back to plain ordinal order if the engine is unavailable.
  const supabase = await createClient();
  let questions: SurveyQuestion[] = [];
  if (supabase) {
    const { data: plan } = await supabase.rpc("quadrant_routing_plan", { p_survey_id: survey.id });
    questions = ((plan ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.question_id as string,
      survey_id: survey.id,
      ordinal: r.ordinal as number,
      prompt: r.prompt as string,
      question_type: r.question_type as SurveyQuestion["question_type"],
      options: (r.options ?? []) as unknown[],
      required: (r.required ?? false) as boolean,
      quadrant: (r.quadrant as string) ?? null,
    }));
  }
  if (questions.length === 0) {
    questions = (await getQuestions(survey.id)).slice(0, survey.question_limit);
  }

  return (
    <SurveyRunner
      survey={survey}
      questions={questions}
      sessionId={detail.session.id}
      participantCode={detail.session.participant?.code ?? "—"}
    />
  );
}
