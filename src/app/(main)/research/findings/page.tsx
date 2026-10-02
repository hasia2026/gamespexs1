import { getFindings, getReports } from "@/lib/data";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FindingsPage() {
  const [findings, reports] = await Promise.all([getFindings(), getReports()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Findings & Reports"
        sub="Evidence accumulates into findings; findings roll up into published reports."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {findings.map((f) => (
          <Card key={f.id}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{f.title}</h3>
              <Badge tone={statusTone(f.confidence)}>{f.confidence}</Badge>
            </div>
            {f.summary && <p className="mt-2 text-sm text-gsx-muted">{f.summary}</p>}
            <p className="mt-3 text-xs text-gsx-muted">
              {new Date(f.created_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
        {findings.length === 0 && (
          <Card><p className="text-sm text-gsx-muted">No findings yet.</p></Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Reports</h2>
        {reports.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{r.title}</h3>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
            {r.body_md && (
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-gsx-muted">
                {r.body_md}
              </pre>
            )}
          </Card>
        ))}
        {reports.length === 0 && (
          <Card><p className="text-sm text-gsx-muted">No reports yet.</p></Card>
        )}
      </section>
    </div>
  );
}
