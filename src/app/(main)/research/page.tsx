import Link from "next/link";
import { getDashboardStats, getStudies } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const [stats, studies] = await Promise.all([getDashboardStats(), getStudies()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research Engine"
        sub="Studies, participants, sessions, surveys, metrics, findings, reports."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Studies" value={stats.active_studies} />
        <StatCard label="Participants" value={stats.total_participants} />
        <StatCard label="Sessions" value={stats.sessions_total} />
        <StatCard label="Responses" value={stats.responses_captured} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {studies.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-gsx-accent-2">{s.code}</span>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </div>
            <h3 className="mt-2 font-medium">{s.title}</h3>
            {s.research_question && (
              <p className="mt-1 text-sm text-gsx-muted">{s.research_question}</p>
            )}
            {s.starts_on && (
              <p className="mt-3 text-xs text-gsx-muted">
                {s.starts_on} → {s.ends_on ?? "open"}
              </p>
            )}
          </Card>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        {[
          ["Studies", "/research/studies"],
          ["Participants", "/research/participants"],
          ["Sessions", "/research/sessions"],
          ["Surveys", "/research/surveys"],
          ["Findings & Reports", "/research/findings"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gsx-border bg-gsx-panel px-4 py-2 text-sm transition-colors hover:border-gsx-accent/40 hover:text-gsx-accent"
          >
            {label} →
          </Link>
        ))}
      </section>
    </div>
  );
}
