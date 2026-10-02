import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";
import { signOut } from "@/app/actions";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

interface PortalActivation {
  event_title: string;
  event_date: string;
  package_name: string;
  fee_cents: number;
  checkins: number;
  mentions: number;
  engagements: number;
}

interface PortalSnapshot {
  ok: boolean;
  error?: string;
  sponsor?: {
    name: string;
    tier: string;
    contact_name: string | null;
    is_prize_partner: boolean;
  };
  mentions_total?: number;
  mentions_recent?: Array<{ phrase: string; source: string; occurred_at: string }>;
  activations?: PortalActivation[];
}

const usd = (cents: number) => `$${(cents / 100).toLocaleString()}`;

const SOURCE_LABELS: Record<string, string> = {
  survey_response: "Survey answer",
  session_note: "Session note",
  event_announcement: "Event announcement",
  manual: "Staff tally",
};

export default async function SponsorPortalPage() {
  if (DEMO_MODE) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-semibold">Sponsor Portal</h1>
        <p className="mt-2 text-sm text-gsx-muted">
          The portal requires the live database. Add Supabase credentials and sign
          in with a sponsor-linked account.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, sponsor_id").maybeSingle();

  // Staff accounts have no business here — send them to the Command Center.
  if (profile && profile.role !== "sponsor") redirect("/");

  const { data: raw } = await supabase.rpc("sponsor_portal_snapshot");
  const snap = (raw ?? null) as PortalSnapshot | null;

  if (!snap?.ok) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-semibold">Sponsor Portal</h1>
        <p className="mt-2 text-sm text-gsx-muted">
          {snap?.error ?? "Your account could not be verified as a sponsor contact."}
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded border border-gsx-border px-4 py-2 text-sm text-gsx-muted hover:text-gsx-text">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const activations = snap.activations ?? [];
  const totalFees = activations.reduce((s, a) => s + a.fee_cents, 0);
  const totalEngagements = activations.reduce((s, a) => s + a.engagements, 0);
  const perDollar = totalEngagements > 0 ? totalFees / totalEngagements : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${snap.sponsor!.name} — Partner Portal`}
        sub={`Welcome${snap.sponsor!.contact_name ? `, ${snap.sponsor!.contact_name}` : ""} · read-only performance view`}
        actions={
          <form action={signOut}>
            <button className="rounded border border-gsx-border px-3 py-1.5 text-xs text-gsx-muted hover:text-gsx-text">
              Sign out
            </button>
          </form>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tier" value={<span className="capitalize">{snap.sponsor!.tier}</span>} sub={snap.sponsor!.is_prize_partner ? "prize partner" : undefined} />
        <StatCard label="Brand Mentions" value={snap.mentions_total ?? 0} sub="all time" />
        <StatCard label="Activations" value={activations.length} sub="sponsored events" />
        <StatCard
          label="Cost / Engagement"
          value={perDollar !== null ? usd(Math.round(perDollar)) : "—"}
          sub={`${totalEngagements} engagements · ${usd(totalFees)} booked`}
        />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Your Event Activations</h2>
        {activations.length === 0 ? (
          <Card><p className="text-sm text-gsx-muted">No sponsored events on record yet.</p></Card>
        ) : (
          <Table head={["Event", "Package", "Fee", "Check-ins", "Mentions", "Engagements", "Cost / eng."]}>
            {activations.map((a) => (
              <tr key={a.event_title + a.event_date} className="hover:bg-gsx-panel-2/50">
                <Td className="font-medium">
                  {a.event_title}
                  <div className="text-xs text-gsx-muted">
                    {new Date(a.event_date).toLocaleDateString()}
                  </div>
                </Td>
                <Td className="text-gsx-muted">{a.package_name}</Td>
                <Td className="tabular-nums">{usd(a.fee_cents)}</Td>
                <Td className="tabular-nums">{a.checkins}</Td>
                <Td className="tabular-nums">{a.mentions}</Td>
                <Td className="tabular-nums font-semibold text-gsx-accent">{a.engagements}</Td>
                <Td className="tabular-nums">
                  {a.engagements > 0 ? usd(Math.round(a.fee_cents / a.engagements)) : "—"}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Where Your Brand Was Named</h2>
        <div className="space-y-2">
          {(snap.mentions_recent ?? []).map((m, i) => (
            <div key={i} className="rounded border border-gsx-border bg-gsx-panel px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <Badge tone="green">{SOURCE_LABELS[m.source] ?? m.source}</Badge>
                <span className="text-gsx-muted">{new Date(m.occurred_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm text-gsx-muted">“{m.phrase}”</p>
            </div>
          ))}
          {(snap.mentions_recent ?? []).length === 0 && (
            <Card><p className="text-sm text-gsx-muted">No mentions recorded yet — they appear automatically when participants name your brand in surveys or staff log announcements.</p></Card>
          )}
        </div>
      </section>

      <p className="text-xs text-gsx-muted">
        This portal is read-only. Full campaign assets, deliverable schedules, and
        invoicing are handled by your GAMESPEXS sponsor manager.
      </p>
    </div>
  );
}
