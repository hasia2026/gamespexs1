import Link from "next/link";
import {
  getBrandMentions, getEvents, getSponsorPackages, getSponsorships, getSponsors,
} from "@/lib/data";
import { MentionLogger } from "@/components/CheckinForm";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  survey_response: "Survey answer",
  session_note: "Session note",
  event_announcement: "Event announcement",
  manual: "Manual tally",
};

export default async function SponsorsPage() {
  const [sponsors, packages, sponsorships, events, mentions] = await Promise.all([
    getSponsors(), getSponsorPackages(), getSponsorships(), getEvents(), getBrandMentions(),
  ]);

  const tally = sponsors
    .map((s) => ({ sponsor: s, count: mentions.filter((m) => m.sponsor_id === s.id).length }))
    .sort((a, b) => b.count - a.count);

  const totalBooked = sponsorships.reduce((s, x) => s + x.fee_cents, 0);
  const tierTone = (t: string) =>
    t === "platinum" ? "blue" : t === "gold" ? "amber" : t === "silver" ? "gray" : "gray";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsors"
        sub="Sponsor relationships, packages, event activations, and performance."
        actions={
          <Link
            href="/sponsors/report"
            className="rounded border border-gsx-gold/40 bg-gsx-gold/10 px-3 py-1.5 text-xs font-medium text-gsx-gold hover:bg-gsx-gold/20"
          >
            🖨 Printable report
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Sponsors" value={sponsors.length} sub={`${sponsors.filter((s) => s.is_prize_partner).length} prize partners`} />
        <StatCard label="Packages" value={packages.length} />
        <StatCard label="Activations" value={sponsorships.length} sub="events with sponsorship" />
        <StatCard label="Booked Revenue" value={`$${(totalBooked / 100).toLocaleString()}`} sub="signed sponsorships" />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Sponsors</h2>
        <Table head={["Sponsor", "Tier", "Contact", "Prize Partner"]}>
          {sponsors.map((s) => (
            <tr key={s.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{s.name}</Td>
              <Td><Badge tone={tierTone(s.tier)}>{s.tier}</Badge></Td>
              <Td className="text-gsx-muted">{s.contact_name ?? "—"}</Td>
              <Td>{s.is_prize_partner ? <Badge tone="green">prize partner</Badge> : "—"}</Td>
            </tr>
          ))}
        </Table>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Packages & Event Activations</h2>
        <Table head={["Package", "Sponsor", "Ad Slots", "Price", "Event", "Fee"]}>
          {sponsorships.map((sh) => (
            <tr key={sh.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-medium">{sh.package?.name ?? "—"}</Td>
              <Td>{sh.package?.sponsor?.name ?? "—"}</Td>
              <Td className="tabular-nums">{sh.package?.ad_slots ?? "—"}</Td>
              <Td className="tabular-nums">${((sh.package?.price_cents ?? 0) / 100).toLocaleString()}</Td>
              <Td className="text-gsx-muted">{sh.event?.title ?? "—"}</Td>
              <Td className="tabular-nums">${(sh.fee_cents / 100).toLocaleString()}</Td>
            </tr>
          ))}
          {sponsorships.length === 0 && (
            <tr><Td>No sponsorships booked yet.</Td></tr>
          )}
        </Table>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Brand Mention Tally</h2>
          <MentionLogger sponsors={sponsors.map((s) => ({ id: s.id, name: s.name }))} />
        </div>
        <p className="mb-3 text-xs text-gsx-muted">
          Every time a sponsor brand is named — in a participant&apos;s survey answer, a session
          note, or an event announcement — it is automatically tallied here and counts toward
          deliverables on the sponsor report.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Table head={["Sponsor", "Total Mentions"]}>
            {tally.map(({ sponsor, count }) => (
              <tr key={sponsor.id} className="hover:bg-gsx-panel-2/50">
                <Td className="font-medium">{sponsor.name}</Td>
                <Td className="tabular-nums">
                  <span className="text-lg font-semibold text-gsx-accent">{count}</span>
                </Td>
              </tr>
            ))}
          </Table>
          <div className="space-y-2">
            {mentions.slice(0, 6).map((m) => (
              <div key={m.id} className="rounded border border-gsx-border bg-gsx-panel px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{m.sponsor?.name ?? "—"}</span>
                  <span className="text-gsx-muted">
                    {SOURCE_LABELS[m.source] ?? m.source} · {new Date(m.occurred_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-gsx-muted">“{m.phrase}”</p>
              </div>
            ))}
            {mentions.length === 0 && (
              <Card><p className="text-sm text-gsx-muted">No mentions tallied yet.</p></Card>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {events.filter((e) => e.event_type === "sponsor_activation").map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{e.title}</h3>
              <Badge tone={e.status === "complete" ? "green" : "blue"}>{e.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-gsx-muted">
              {new Date(e.starts_at).toLocaleDateString()} · {e.location?.name}
            </p>
          </Card>
        ))}
      </section>

      <Card className="border-dashed">
        <p className="text-xs text-gsx-muted">
          Phase 4 deepening: ad-package inventory management, prize fulfillment tracking,
          engagement-per-dollar reporting, and sponsor self-service portals.
        </p>
      </Card>
    </div>
  );
}
