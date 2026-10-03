import { notFound } from "next/navigation";
import { getQuestions, getSessionDetail, getSurveys } from "@/lib/data";
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

  // Tablet rules (Steve directive): a mandatory sequential flow — the immediate
  // post-game queries display first, followed by the historical play-frequency
  // fields. Ordinal order is kept inside each phase; no shuffling.
  const phaseRank = (p?: string | null) => (p === "play_history" ? 1 : 0);
  const questions: SurveyQuestion[] = (await getQuestions(survey.id))
    .slice()
    .sort((a, b) => phaseRank(a.phase) - phaseRank(b.phase) || a.ordinal - b.ordinal)
    .slice(0, survey.question_limit);

  return (
    <SurveyRunner
      survey={survey}
      questions={questions}
      sessionId={detail.session.id}
      participantCode={detail.session.participant?.code ?? "—"}
    />
  );
}
