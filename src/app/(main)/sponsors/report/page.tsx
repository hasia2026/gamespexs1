import Image from "next/image";
import Link from "next/link";
import {
  getBrandMentions, getCheckins, getEvents, getSponsorships, getSponsors,
} from "@/lib/data";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function SponsorReportPage() {
  const [sponsors, sponsorships, events, mentions] = await Promise.all([
    getSponsors(), getSponsorships(), getEvents(), getBrandMentions(),
  ]);

  const activation = sponsorships[0];
  const activationEvent = activation
    ? events.find((e) => e.id === activation.event_id)
    : undefined;

  // Engagement-per-dollar: each check-in and each brand mention counts as one
  // recorded engagement delivered for a sponsored event.
  const rows = await Promise.all(
    sponsorships.map(async (sh) => {
      const event = events.find((e) => e.id === sh.event_id);
      const checkins = event ? await getCheckins(event.id) : [];
      const eventMentions = mentions.filter((m) => m.context_ref === sh.event_id);
      const engagements = checkins.length + eventMentions.length;
      return {
        id: sh.id,
        sponsor: sh.package?.sponsor?.name ?? "—",
        pkg: sh.package?.name ?? "—",
        event: event?.title ?? "—",
        fee: sh.fee_cents,
        checkins: checkins.length,
        mentions: eventMentions.length,
        engagements,
        perDollar: engagements > 0 ? sh.fee_cents / engagements : null,
      };
    }),
  );

  const fmt = (c: number) => `$${(c / 100).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/sponsors" className="text-sm text-gsx-accent hover:underline">
          ← Back to Sponsors
        </Link>
        <PrintButton />
      </div>

      {/* Report header */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-gsx-gold/50 pb-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="GAMESPEXS"
            width={140}
            height={75}
            className="rounded"
            priority
          />
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-wide">Sponsor Performance Report</h1>
          <p className="mt-1 text-sm text-gsx-muted">
            Period: Q4 2026 · Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-sm text-gsx-muted">Prepared for sponsor review · Confidential</p>
        </div>
      </header>

      {/* Executive summary */}
      <section>
        <h2 className="mb-3 border-b border-gsx-border pb-1 text-sm font-semibold uppercase tracking-wider text-gsx-gold">
          Executive Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded border border-gsx-border p-4">
            <div className="text-2xl font-bold text-gsx-accent">{sponsors.length}</div>
            <div className="mt-1 text-xs text-gsx-muted">Active sponsors</div>
          </div>
          <div className="rounded border border-gsx-border p-4">
            <div className="text-2xl font-bold text-gsx-accent">{sponsorships.length}</div>
            <div className="mt-1 text-xs text-gsx-muted">Event activations</div>
          </div>
          <div className="rounded border border-gsx-border p-4">
            <div className="text-2xl font-bold text-gsx-accent">
              {fmt(sponsorships.reduce((s, x) => s + x.fee_cents, 0))}
            </div>
            <div className="mt-1 text-xs text-gsx-muted">Booked sponsorship revenue</div>
          </div>
        </div>
      </section>

      {/* Engagement-per-dollar */}
      {rows.length > 0 && (
        <section>
          <h2 className="mb-3 border-b border-gsx-border pb-1 text-sm font-semibold uppercase tracking-wider text-gsx-gold">
            Engagement per Dollar
          </h2>
          <p className="mb-3 text-xs text-gsx-muted">
            One engagement = one event check-in or one recorded brand mention for the
            sponsored event. Cost per engagement = contracted fee ÷ engagements delivered.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gsx-border text-left text-xs uppercase tracking-wider text-gsx-muted">
                <th className="py-2 pr-4">Sponsor</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4 text-right">Fee</th>
                <th className="py-2 pr-4 text-right">Check-ins</th>
                <th className="py-2 pr-4 text-right">Mentions</th>
                <th className="py-2 text-right">Cost / engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gsx-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-4 font-medium">{r.sponsor}</td>
                  <td className="py-2 pr-4 text-gsx-muted">{r.event}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{fmt(r.fee)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{r.checkins}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{r.mentions}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-gsx-accent">
                    {r.perDollar !== null ? fmt(r.perDollar) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Activation detail */}
      {activation && activationEvent && (
        <section>
          <h2 className="mb-3 border-b border-gsx-border pb-1 text-sm font-semibold uppercase tracking-wider text-gsx-gold">
            Featured Activation — {activationEvent.title}
          </h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gsx-border">
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Sponsor</td>
                <td className="py-2 font-medium">{activation.package?.sponsor?.name ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Package</td>
                <td className="py-2">{activation.package?.name ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Date & venue</td>
                <td className="py-2">
                  {new Date(activationEvent.starts_at).toLocaleDateString()} · {activationEvent.location?.name ?? "—"}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Ad slots delivered</td>
                <td className="py-2">{activation.package?.ad_slots ?? 0} of {activation.package?.ad_slots ?? 0}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Expected attendance</td>
                <td className="py-2">{activationEvent.expected_attendance ?? "—"} participants</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gsx-muted">Activation fee</td>
                <td className="py-2 font-semibold">{fmt(activation.fee_cents)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Sponsor roster */}
      <section>
        <h2 className="mb-3 border-b border-gsx-border pb-1 text-sm font-semibold uppercase tracking-wider text-gsx-gold">
          Sponsor Roster
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gsx-border text-left text-xs uppercase tracking-wider text-gsx-muted">
              <th className="py-2 pr-4">Sponsor</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2">Prize Partner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gsx-border">
            {sponsors.map((s) => (
              <tr key={s.id}>
                <td className="py-2 pr-4 font-medium">{s.name}</td>
                <td className="py-2 pr-4 capitalize">{s.tier}</td>
                <td className="py-2 pr-4 text-gsx-muted">{s.contact_name ?? "—"}</td>
                <td className="py-2">{s.is_prize_partner ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="border-t border-gsx-border pt-4 text-xs text-gsx-muted">
        <p>
          GAMESPEXS Research & Operations · Columbus, Ohio · This report summarizes
          sponsorship delivery for the stated period. Engagement analytics and
          participant demographics are available in the platform.
        </p>
      </footer>
    </div>
  );
}
