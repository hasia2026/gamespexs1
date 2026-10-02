import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionDetail } from "@/lib/data";
import GazeHeatmap from "@/components/GazeHeatmap";
import { MetricGauge } from "@/components/charts";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

const GAUGE_RANGES: Record<string, { min: number; max: number; label: string; fmt?: (v: number) => string }> = {
  engagement_score:   { min: 0, max: 10, label: "Engagement", fmt: (v) => v.toFixed(1) },
  reaction_time_ms:   { min: 200, max: 600, label: "Reaction Time" },
  gaze_fixation_count:{ min: 0, max: 150, label: "Gaze Fixations" },
  heatmap_density:    { min: 0, max: 1, label: "Heatmap Density", fmt: (v) => v.toFixed(2) },
  persistence_events: { min: 0, max: 20, label: "Persistence Events" },
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSessionDetail(id);
  if (!detail) notFound();

  const { session, metrics, gaze, questions } = detail;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Session ${session.id.slice(0, 8)}`}
        sub={`${session.participant?.display_name ?? session.participant?.code} · ${session.game?.title ?? "Unknown game"} · ${new Date(session.session_date).toLocaleDateString()}`}
        actions={
          <>
            <Link
              href={`/research/sessions/${session.id}/run`}
              className="rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              ▶ Launch Survey Runner
            </Link>
            <Badge tone={statusTone(session.status)}>{session.status}</Badge>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><span className="text-xs text-gsx-muted">Study</span><div className="mt-1 font-mono text-sm text-gsx-accent-2">{session.study?.code ?? "—"}</div></Card>
        <Card><span className="text-xs text-gsx-muted">Channel</span><div className="mt-1 text-sm capitalize">{session.channel.replace("_", " ")}</div></Card>
        <Card><span className="text-xs text-gsx-muted">Location</span><div className="mt-1 text-sm">{session.location?.name ?? "—"}</div></Card>
        <Card><span className="text-xs text-gsx-muted">Duration</span><div className="mt-1 text-sm tabular-nums">{session.duration_minutes ?? "—"} min</div></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Behavioral Metrics</h2>
          <div className="space-y-3">
            {metrics.map((m) => {
              const r = GAUGE_RANGES[m.metric_key];
              if (!r) return null;
              return (
                <MetricGauge
                  key={m.id}
                  label={r.label}
                  value={Number(m.metric_value)}
                  unit={m.unit}
                  min={r.min}
                  max={r.max}
                  format={r.fmt}
                />
              );
            })}
            {metrics.length === 0 && (
              <Card><p className="text-sm text-gsx-muted">No metrics captured.</p></Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Eye Tracking</h2>
          <GazeHeatmap
            fixations={gaze}
            title={`${session.game?.title ?? "Game"} — screen attention`}
          />
          <p className="mt-2 text-xs text-gsx-muted">
            Fixations normalized to the play screen. Heat builds where gaze dwells;
            colored by the brand colormap (teal → orange core).
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Survey Answers</h2>
        <div className="space-y-2">
          {questions.map(({ question: q, response }) => (
            <div
              key={q.id}
              className="flex items-start gap-3 rounded border border-gsx-border bg-gsx-panel px-3 py-2"
            >
              <span className="mt-0.5 font-mono text-xs text-gsx-muted">
                {String(q.ordinal).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="text-sm">{q.prompt}</div>
                {q.options.length > 0 && response !== null && (
                  <div className="mt-0.5 text-xs text-gsx-muted">
                    answered: <span className="text-gsx-text">{String(response)}</span>
                  </div>
                )}
                {q.options.length === 0 && response !== null && (
                  <div className="mt-0.5 text-sm text-gsx-accent">{String(response)}</div>
                )}
              </div>
              {response === null && <Badge tone="amber">unanswered</Badge>}
            </div>
          ))}
          {questions.length === 0 && (
            <Card><p className="text-sm text-gsx-muted">No survey attached to this session.</p></Card>
          )}
        </div>
      </section>

      <div>
        <Link href="/research/sessions" className="text-sm text-gsx-accent hover:underline">
          ← Back to sessions
        </Link>
      </div>
    </div>
  );
}
