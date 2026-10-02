import Link from "next/link";
import { getQualityReport } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const CHECK_LABELS: Record<string, string> = {
  straightlining: "Straightlining",
  duplicate_codes: "Duplicate codes",
  consent_gaps: "Consent gaps",
  duration_outliers: "Duration outliers",
  missing_metrics: "Missing metrics",
};

export default async function QualityPage() {
  const report = await getQualityReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality"
        sub="Automated data-auditing: fraud indicators, consent gaps, and collection anomalies across all studies."
        actions={
          <Badge tone={report.tone}>
            {report.score}/100 · {report.label}
          </Badge>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Quality Score" value={report.score} sub={report.label} />
        <StatCard
          label="Checks Passed"
          value={`${report.checks.filter((c) => c.passed).length}/${report.checks.length}`}
        />
        <StatCard label="Open Findings" value={report.findings.length} />
        <StatCard
          label="Flagged Records"
          value={report.checks.reduce((s, c) => s + c.affected, 0)}
          sub="sessions + participants"
        />
      </section>

      <Table head={["Audit Check", "Result", "Flagged"]}>
        {report.checks.map((c) => (
          <tr key={c.label} className="hover:bg-gsx-panel-2/50">
            <Td className="font-medium">{c.label}</Td>
            <Td>
              {c.passed ? <Badge tone="green">✓ passed</Badge> : <Badge tone="red">✗ flagged</Badge>}
            </Td>
            <Td className="tabular-nums">{c.affected}</Td>
          </tr>
        ))}
      </Table>

      {report.findings.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold">Findings</h2>
          {report.findings.map((f) => (
            <Card key={f.key}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {f.title} <span className="ml-1 text-xs text-gsx-muted">({CHECK_LABELS[f.key] ?? f.key})</span>
                </h3>
                <Badge tone={f.key === "consent_gaps" ? "red" : "amber"}>
                  {f.affected.length} affected
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gsx-muted">{f.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {f.affected.slice(0, 12).map((id) => (
                  <Link
                    key={id}
                    href={id.startsWith("sess-") ? `/research/sessions/${id}` : "/research/participants"}
                    className="rounded border border-gsx-border bg-gsx-panel-2 px-2 py-0.5 font-mono text-xs text-gsx-accent-2 hover:border-gsx-accent/40"
                  >
                    {id}
                  </Link>
                ))}
                {f.affected.length > 12 && (
                  <span className="text-xs text-gsx-muted">+{f.affected.length - 12} more</span>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}

      <Card>
        <p className="text-xs text-gsx-muted">
          Scoring: 100 minus penalties per flagged record (consent gaps weigh heaviest, then
          straightlining and missing metrics). Studies below 70 need attention before their data
          feeds sponsor or institutional reports. Checks run live on every load.
        </p>
      </Card>
    </div>
  );
}
