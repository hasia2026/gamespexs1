import { getGrants, getPrograms } from "@/lib/data";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

const usd = (cents: number) => `$${(cents / 100).toLocaleString()}`;

const AGENCY_LABELS: Record<string, string> = {
  government: "Government",
  foundation: "Foundation",
  corporate: "Corporate",
  university: "University",
  other: "Other",
};

const PROGRAM_LABELS: Record<string, string> = {
  corrections: "Corrections",
  government_agency: "Gov agency",
  research_partner: "Research partner",
  education: "Education",
  other: "Other",
};

export default async function InstitutionalPage() {
  const [grants, programs] = await Promise.all([getGrants(), getPrograms()]);

  const awarded = grants.filter((g) => g.status === "awarded" || g.status === "completed");
  const pipeline = grants.filter((g) => g.status === "prospect" || g.status === "submitted");
  const activePrograms = programs.filter((p) => p.status === "active");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional"
        sub="Grants, corrections and agency partners, and closed-network research programs."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Awarded Funding" value={usd(awarded.reduce((s, g) => s + g.amount_cents, 0))} sub={`${awarded.length} grants`} />
        <StatCard label="In Pipeline" value={usd(pipeline.reduce((s, g) => s + g.amount_cents, 0))} sub={`${pipeline.length} active applications`} />
        <StatCard label="Active Programs" value={activePrograms.length} sub={`${programs.length} total`} />
        <StatCard
          label="Closed-Network Sites"
          value={new Set(programs.filter((p) => p.is_closed_network).map((p) => p.site_location_id)).size}
          sub="facilities under protocol"
        />
      </section>

      {/* Programs */}
      <section>
        <h2 className="mb-3 font-semibold">Institutional Programs</h2>
        {programs.length === 0 ? (
          <EmptyState title="No programs yet" sub="Corrections, agency, and education programs appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {programs.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-gsx-muted">
                      {p.partner_org?.name ?? "Partner not set"} · {PROGRAM_LABELS[p.program_type] ?? p.program_type}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={statusTone(p.status === "active" ? "active" : p.status === "planning" ? "draft" : p.status)}>{p.status}</Badge>
                    {p.is_closed_network && <Badge tone="blue">closed network</Badge>}
                  </div>
                </div>
                {p.description && <p className="mt-2 text-sm text-gsx-muted">{p.description}</p>}
                {p.site_location && (
                  <p className="mt-2 text-xs text-gsx-muted">Site: {p.site_location.name}</p>
                )}
                {p.consent_protocol_notes && (
                  <p className="mt-2 rounded border border-gsx-warn/30 bg-gsx-warn/5 p-2 text-xs text-gsx-muted">
                    Consent protocol: {p.consent_protocol_notes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Grants */}
      <section>
        <h2 className="mb-3 font-semibold">Grants & Funding</h2>
        <Table head={["Grant", "Funder", "Type", "Amount", "Window", "Status"]}>
          {grants.map((g) => (
            <tr key={g.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{g.title}</Td>
              <Td className="text-gsx-muted">{g.funder}</Td>
              <Td>{AGENCY_LABELS[g.agency_type] ?? g.agency_type}</Td>
              <Td className="tabular-nums">{g.amount_cents > 0 ? usd(g.amount_cents) : "—"}</Td>
              <Td className="whitespace-nowrap text-gsx-muted">
                {g.starts_on ?? "—"} → {g.ends_on ?? "open"}
              </Td>
              <Td>
                <Badge
                  tone={
                    g.status === "awarded" || g.status === "completed"
                      ? "green"
                      : g.status === "submitted" || g.status === "prospect"
                        ? "blue"
                        : "red"
                  }
                >
                  {g.status}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      </section>

      <Card>
        <p className="text-xs text-gsx-muted">
          Closed-network programs operate under facility supervision with documented
          consent protocols. A program listing here does not constitute eligibility
          clearance — consent and age procedures are operational, reviewed per
          facility, and recorded per session.
        </p>
      </Card>
    </div>
  );
}
