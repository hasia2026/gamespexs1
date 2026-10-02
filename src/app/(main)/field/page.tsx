import Link from "next/link";
import { getEquipment, getEvents, getRoutes, getTeams, getUnits } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard, Table, Td, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "fleet", label: "Fleet" },
  { key: "routes", label: "Routes" },
  { key: "events", label: "Events" },
  { key: "teams", label: "Teams" },
  { key: "equipment", label: "Equipment" },
] as const;

export default async function FieldPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; event?: string }>;
}) {
  const { tab = "fleet" } = await searchParams;
  const [units, routes, events, teams, equipment] = await Promise.all([
    getUnits(), getRoutes(), getEvents(), getTeams(), getEquipment(),
  ]);

  const activeTab = TABS.some((t) => t.key === tab) ? tab : "fleet";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Operations"
        sub="The mobile research network: fleet, routes, events, teams, and equipment."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Units Active" value={units.filter((u) => u.status === "active").length} sub={`${units.length} in fleet`} />
        <StatCard label="Upcoming Events" value={events.filter((e) => e.status === "planned").length} sub={`${events.length} total`} />
        <StatCard label="Field Teams" value={teams.length} />
        <StatCard label="Equipment Ready" value={equipment.filter((e) => e.status === "ready").length} sub={`${equipment.filter((e) => e.status === "in_use").length} in use`} />
      </section>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/field?tab=${t.key}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeTab === t.key
                ? "border-gsx-accent/40 bg-gsx-accent/10 text-gsx-accent"
                : "border-gsx-border text-gsx-muted hover:text-gsx-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {activeTab === "fleet" && (
        <Table head={["Unit", "Call Sign", "Vehicle", "Status"]}>
          {units.map((u) => (
            <tr key={u.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{u.name}</Td>
              <Td className="font-mono text-xs text-gsx-accent-2">{u.call_sign ?? "—"}</Td>
              <Td className="text-gsx-muted">{u.make_model ?? "—"}</Td>
              <Td><Badge tone={u.status === "active" ? "green" : u.status === "maintenance" ? "amber" : "gray"}>{u.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      )}

      {activeTab === "routes" && (
        <div className="space-y-4">
          {routes.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.name}</span>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
                <div className="text-xs text-gsx-muted">
                  {r.unit?.name ?? "unassigned"} · {r.route_date}
                </div>
              </div>
              <ol className="mt-3 space-y-1.5">
                {(r.stops ?? []).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gsx-accent/40 text-[10px] text-gsx-accent">
                      {s.stop_order}
                    </span>
                    <span>{(s as { location?: { name?: string } }).location?.name ?? "Stop"}</span>
                    <span className="text-xs text-gsx-muted">{s.arrive_at} – {s.depart_at}</span>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "events" && (
        <Table head={["Code", "Event", "Type", "When", "Location", "Attendance", "Check-in", "Status"]}>
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-mono text-xs text-gsx-accent-2"><Link href={`/field/events/${e.id}`} className="hover:underline">{e.code}</Link></Td>
              <Td className="font-medium"><Link href={`/field/events/${e.id}`} className="hover:text-gsx-accent">{e.title}</Link></Td>
              <Td><span className="capitalize">{e.event_type.replace("_", " ")}</span></Td>
              <Td className="whitespace-nowrap text-gsx-muted">
                {new Date(e.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Td>
              <Td className="text-gsx-muted">{e.location?.name ?? "—"}</Td>
              <Td className="tabular-nums">{e.expected_attendance ?? "—"}</Td>
              <Td>
                <Link
                  href={`/field/qr/${e.id}`}
                  className="rounded border border-gsx-accent/40 bg-gsx-accent/10 px-2 py-1 text-xs text-gsx-accent hover:bg-gsx-accent/20"
                >
                  QR ⛶
                </Link>
              </Td>
              <Td><Badge tone={statusTone(e.status)}>{e.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      )}

      {activeTab === "teams" && (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((t) => (
            <Card key={t.id}>
              <h3 className="font-medium">{t.name}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(t.members ?? []).map((m, i) => (
                  <li key={m.person.id + String(i)} className="flex items-center justify-between">
                    <span>{m.person.full_name}</span>
                    <Badge tone="blue"><span className="capitalize">{m.role_on_team}</span></Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "equipment" && (
        <Table head={["Equipment", "Type", "Serial", "Assigned To", "Status"]}>
          {equipment.map((e) => (
            <tr key={e.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{e.name}</Td>
              <Td><span className="capitalize">{e.equipment_type.replace("_", " ")}</span></Td>
              <Td className="font-mono text-xs text-gsx-muted">{e.serial_number ?? "—"}</Td>
              <Td className="text-gsx-muted">{e.unit?.name ?? "—"}</Td>
              <Td>
                <Badge tone={e.status === "ready" ? "green" : e.status === "in_use" ? "blue" : e.status === "maintenance" ? "amber" : "gray"}>
                  {e.status.replace("_", " ")}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
