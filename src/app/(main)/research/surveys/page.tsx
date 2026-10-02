import { getSurveyResults, getSurveys } from "@/lib/data";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";
import { DistributionChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        sub="Blueprint constraint: every survey is capped at 15 questions and targets a 10–12 minute completion window."
      />

      {await Promise.all(
        surveys.map(async (sv) => {
          const results = await getSurveyResults(sv.id);
          const questions = results.map((r) => r.question);
          return (
            <Card key={sv.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-medium">{sv.title}</h2>
                  {sv.description && (
                    <p className="mt-0.5 text-sm text-gsx-muted">{sv.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{questions.length}/15 questions</Badge>
                  <Badge tone="gray">{sv.estimated_minutes} min target</Badge>
                  <Badge tone={statusTone(sv.status)}>{sv.status}</Badge>
                </div>
              </div>

              <ol className="mt-4 space-y-4">
                {results.map(({ question: q, distribution }) => (
                  <li
                    key={q.id}
                    className="rounded border border-gsx-border bg-gsx-panel-2 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-xs text-gsx-muted">
                          {String(q.ordinal).padStart(2, "0")}
                        </span>
                        <span className="text-sm">{q.prompt}</span>
                      </div>
                      <Badge tone="gray">{q.question_type}</Badge>
                    </div>
                    {distribution.length > 0 && (
                      <div className="mt-3 pl-7">
                        <DistributionChart data={distribution} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          );
        }),
      )}
    </div>
  );
}
