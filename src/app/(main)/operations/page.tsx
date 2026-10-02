import { getLocations, getSessions } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [locations, sessions] = await Promise.all([getLocations(), getSessions()]);

  const byChannel = (channel: string) => sessions.filter((s) => s.channel === channel).length;
  const sessionCount = (locId: string) => sessions.filter((s) => s.location_id === locId).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations Status"
        sub="Where research happens: storefront, mobile units, events, and institutional sites."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Storefront" value={byChannel("storefront")} sub="sessions" />
        <StatCard label="Mobile Units" value={byChannel("mobile_unit")} sub="sessions" />
        <StatCard label="Events" value={byChannel("event")} sub="sessions" />
        <StatCard label="Institutional" value={byChannel("institutional")} sub="sessions" />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Locations</h2>
        <Table head={["Location", "Type", "City", "County", "Sessions"]}>
          {locations.map((l) => (
            <tr key={l.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{l.name}</Td>
              <Td><span className="capitalize">{l.location_type.replace("_", " ")}</span></Td>
              <Td>{l.city ?? "—"}</Td>
              <Td className="text-gsx-muted">{l.county ?? "—"}</Td>
              <Td className="tabular-nums">{sessionCount(l.id)}</Td>
            </tr>
          ))}
        </Table>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold">Coming in Phase 3</h3>
          <p className="mt-1 text-xs text-gsx-muted">
            Mobile-unit fleet management, route planning, field-team assignment, game judges, and event check-in.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">Coming in Phase 7</h3>
          <p className="mt-1 text-xs text-gsx-muted">
            Storefront reservations, game-room scheduling, theater calendar, gift shop, and merchandise.
          </p>
        </Card>
      </section>
    </div>
  );
}
