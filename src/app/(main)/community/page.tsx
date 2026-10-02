import Link from "next/link";
import { getCommunityOverview } from "@/lib/data";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const { heroes, cities, organizations, events } = await getCommunityOverview();

  const communityEvents = events.filter((e) => e.event_type === "community");
  const totalHeroEvents = heroes.reduce((s, h) => s + h.events, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        sub="Local Heroes, geographic coverage, partner organizations, and community outreach."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Local Heroes" value={heroes.length} sub="community workers" />
        <StatCard label="Hero Event Shifts" value={totalHeroEvents} sub="staffed by heroes" />
        <StatCard label="Cities Covered" value={cities.length} sub={`${cities.reduce((s, c) => s + c.locations, 0)} locations`} />
        <StatCard label="Partner Organizations" value={organizations.length} />
      </section>

      {/* Local Heroes */}
      <section>
        <h2 className="mb-3 font-semibold">Local Heroes</h2>
        {heroes.length === 0 ? (
          <EmptyState
            title="No community workers documented yet"
            sub="Add people with the community_worker type in People."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {heroes.map((h) => (
              <Card key={h.person.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{h.person.full_name}</div>
                    {h.person.email && (
                      <div className="text-xs text-gsx-muted">{h.person.email}</div>
                    )}
                  </div>
                  <Badge tone={h.person.is_active ? "green" : "gray"}>
                    {h.person.is_active ? "active" : "inactive"}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-gsx-muted">
                  {h.events} event shift{h.events === 1 ? "" : "s"}
                </div>
                {h.locations.length > 0 && (
                  <div className="mt-1 text-xs text-gsx-muted">
                    {h.locations.join(" · ")}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cities & Counties */}
      <section>
        <h2 className="mb-3 font-semibold">Cities & Counties</h2>
        <Table head={["City", "County", "State", "Locations", "Events", "Participants"]}>
          {cities.map((c) => (
            <tr key={c.city} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{c.city}</Td>
              <Td className="text-gsx-muted">{c.county ?? "—"}</Td>
              <Td className="text-gsx-muted">{c.state ?? "—"}</Td>
              <Td className="tabular-nums">{c.locations}</Td>
              <Td className="tabular-nums">{c.events}</Td>
              <Td className="tabular-nums">{c.participants}</Td>
            </tr>
          ))}
        </Table>
      </section>

      {/* Partner organizations */}
      <section>
        <h2 className="mb-3 font-semibold">Partner Organizations</h2>
        <Table head={["Organization", "Type", "Website"]}>
          {organizations.map((o) => (
            <tr key={o.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{o.name}</Td>
              <Td><span className="capitalize">{o.org_type.replace("_", " ")}</span></Td>
              <Td className="text-gsx-muted">
                {o.website ? (
                  <a href={o.website} className="text-gsx-accent hover:underline" target="_blank" rel="noreferrer">
                    {o.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </section>

      {/* Community events */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Community Events</h2>
          <Link href="/field?tab=events" className="text-xs text-gsx-accent hover:underline">
            Manage in Field Operations →
          </Link>
        </div>
        {communityEvents.length === 0 ? (
          <EmptyState title="No community events yet" sub="Create community events in Field Operations." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {communityEvents.map((e) => (
              <Card key={e.id}>
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/field/events/${e.id}`} className="font-medium hover:text-gsx-accent">
                    {e.title}
                  </Link>
                  <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-gsx-muted">
                  {new Date(e.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  {" · "}
                  {e.location?.name ?? "—"}
                  {e.expected_attendance ? ` · ${e.expected_attendance} expected` : ""}
                </p>
                {e.teamNames.length > 0 && (
                  <p className="mt-1 text-xs text-gsx-muted">Teams: {e.teamNames.join(", ")}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
