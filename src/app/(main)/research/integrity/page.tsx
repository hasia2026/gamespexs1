import { getMechanicInsights, getQualityReport } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IntegrityPage() {
  const [quality, mechanics] = await Promise.all([
    getQualityReport(),
    getMechanicInsights(),
  ]);

  const tone = quality.tone;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Integrity & Game Intelligence"
        sub="Automated checks surface questionable records for human review; mechanic-level results turn sessions into catalog intelligence."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Integrity Score" value={`${quality.score}/100`} sub={quality.label} />
        <StatCard label="Checks Passed" value={`${quality.checks.filter((check) => check.passed).length}/${quality.checks.length}`} sub="automated quality rules" />
        <StatCard label="Mechanics Analyzed" value={mechanics.length} sub="linked to completed sessions" />
      </section>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Quality gate</h2>
            <p className="mt-1 text-xs text-gsx-muted">Flags are recommendations for trained review, not automatic judgments about participants.</p>
          </div>
          <Badge tone={tone}>{quality.label}</Badge>
        </div>
        <Table head={["Check", "Result", "Affected", "Review signal"]}>
          {quality.checks.map((check) => {
            const findingKey: Record<string, string> = {
              "No straightlined surveys": "straightlining",
              "No duplicate participant codes": "duplicate_codes",
              "All participants have consent": "consent_gaps",
              "Session durations plausible": "duration_outliers",
              "All sessions have metrics": "missing_metrics",
            };
            const finding = quality.findings.find((item) => item.key === findingKey[check.label]);
            return (
              <tr key={check.label} className="hover:bg-gsx-panel-2/50">
                <Td className="font-medium">{check.label}</Td>
                <Td><Badge tone={check.passed ? "green" : "amber"}>{check.passed ? "Pass" : "Review"}</Badge></Td>
                <Td className="tabular-nums">{check.affected}</Td>
                <Td className="text-gsx-muted">{finding?.detail ?? (check.passed ? "No records flagged." : "Inspect flagged records before using them in reports.")}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Mechanic-level insights</h2>
            <p className="mt-1 text-xs text-gsx-muted">Behavioral metrics are rolled up across games sharing each mechanic.</p>
          </div>
          <span className="text-xs text-gsx-muted">Observational data, not causal conclusions</span>
        </div>
        <Table head={["Mechanic", "Sessions", "Avg. Engagement", "Avg. Reaction", "Persistence", "Games"]}>
          {mechanics.map((insight) => (
            <tr key={insight.mechanic_id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{insight.mechanic}</Td>
              <Td className="tabular-nums">{insight.sessions}</Td>
              <Td className="tabular-nums">{insight.engagement?.toFixed(2) ?? "—"}</Td>
              <Td className="tabular-nums">{insight.reaction_ms === null ? "—" : `${insight.reaction_ms.toFixed(0)} ms`}</Td>
              <Td className="tabular-nums">{insight.persistence?.toFixed(2) ?? "—"}</Td>
              <Td className="text-gsx-muted">{insight.games.join(", ") || "—"}</Td>
            </tr>
          ))}
          {mechanics.length === 0 && (
            <tr><Td>No linked session data yet. Tag game mechanics and capture sessions to build this view.</Td></tr>
          )}
        </Table>
      </section>

      {quality.findings.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Human review queue</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {quality.findings.map((finding) => (
              <Card key={finding.key} className="border-gsx-warn/30">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{finding.title}</h3>
                  <Badge tone="amber">{finding.affected.length} flagged</Badge>
                </div>
                <p className="mt-2 text-sm text-gsx-muted">{finding.detail}</p>
                <p className="mt-2 break-all font-mono text-xs text-gsx-muted">{finding.affected.slice(0, 8).join(", ")}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
