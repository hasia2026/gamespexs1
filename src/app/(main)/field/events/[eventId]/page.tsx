import Link from "next/link";
import { notFound } from "next/navigation";
import { MentionLogger } from "@/components/CheckinForm";
import { getEventOperationsSnapshot, getSponsors } from "@/lib/data";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

const usd = (cents: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
}).format(cents / 100);

export default async function EventCommandPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [snapshot, sponsors] = await Promise.all([
    getEventOperationsSnapshot(eventId), getSponsors(),
  ]);
  if (!snapshot) notFound();

  const { event, checkins, sessions, teams, equipment, sponsorships, mentions, sponsorSetupMissing } = snapshot;
  const eventMentions = mentions;
  const consentReview = checkins.filter((checkin) => !checkin.participant?.consent_given).length;
  const unknownBirthYear = checkins.filter((checkin) => !checkin.participant?.birth_year).length;
  const judges = teams.flatMap((team) => team.members ?? []).filter((member) => member.role_on_team === "judge");
  const sponsorRevenue = sponsorships.reduce((sum, sponsorship) => sum + sponsorship.fee_cents, 0);

  const steps = [
    { title: "Event created", status: "Tracked", detail: `${event.code} · ${event.status}` },
    { title: "Players register / check in", status: checkins.length ? "Tracked" : "No check-ins", detail: `${checkins.length} participant check-ins` },
    { title: "Age & research eligibility review", status: "Manual review", detail: `${unknownBirthYear} missing birth year · ${consentReview} without research consent. Event entry and research consent are separate.` },
    { title: "Game selected", status: sessions.length ? "Research sessions" : "Not linked", detail: sessions.length ? [...new Set(sessions.map((session) => session.game?.title).filter(Boolean))].join(", ") : "No event-linked research sessions yet." },
    { title: "Tables assigned", status: "Not tracked", detail: "Table and match-station assignments are not in the current event schema." },
    { title: "Judges assigned", status: judges.length ? "Staffed" : "Needs assignment", detail: judges.length ? judges.map((member) => member.person.full_name).join(", ") : "No assigned event team currently has a judge role." },
    { title: "Camera assigned", status: "Not tracked", detail: "Camera and media-crew assignments are not in the current event schema." },
    { title: "DJ shift assigned", status: "Not tracked", detail: "DJ shifts are not in the current event schema." },
    { title: "Matches begin", status: sessions.length ? "Sessions recorded" : "Not tracked", detail: "Research sessions exist; competitive match scheduling is not implemented." },
    { title: "Scores entered & results calculated", status: "Not tracked", detail: "Match score entry and standings are not in the current event schema." },
    { title: "Payouts calculated", status: "Ledger ready", detail: "The payout ledger automates the blueprint's fixed splits — ⅓-⅓-⅓ studies, judge session percentages, street-team commissions. Record and approve in Admin → Payouts Ledger." },
    { title: "Media assets attached", status: "Not tracked", detail: "Event photo/video asset storage and consent tracking are not implemented." },
    { title: "Sponsor package generated", status: sponsorships.length ? "Package linked" : "No package", detail: sponsorships.length ? `${sponsorships.length} activation(s) · ${usd(sponsorRevenue)} contracted fee` : "No sponsor activation is linked to this event." },
    { title: "Event analytics updated", status: "Live roll-up", detail:`${checkins.length} check-ins · ${sessions.length} linked research sessions · ${eventMentions.length} event-linked sponsor mentions` },
    { title: "Research data captured", status: sessions.length ? "Sessions linked" : "No linked data", detail: `${sessions.length} session(s) associated by event location and study.` },
    { title: "Management operating picture", status: "This view", detail: "Current event, attendance, staffing, equipment, sponsor, and research signals are consolidated below." },
  ];

  const tracked = steps.filter((step) => ["Tracked", "Staffed", "Package linked", "Ledger ready", "Live roll-up", "Sessions linked", "This view"].includes(step.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/field?tab=events" className="text-sm text-gsx-accent hover:underline">← Field events</Link>
        <Link href={`/field/qr/${event.id}`} className="rounded border border-gsx-accent/40 bg-gsx-accent/10 px-3 py-1.5 text-xs text-gsx-accent hover:bg-gsx-accent/20">Event check-in QR</Link>
      </div>

      <PageHeader
        title="Event Command Center"
        sub={`${event.code} · ${event.title} · ${event.location?.name ?? "Location not set"}`}
        actions={<Badge tone={event.status === "complete" ? "green" : event.status === "active" ? "amber" : "blue"}>{event.status}</Badge>}
      />

      <Card className="border-gsx-accent/30 bg-gradient-to-br from-gsx-panel to-gsx-accent/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gsx-accent">One event through the GAMESPEXS hub</p>
        <h2 className="mt-2 text-xl font-semibold">A single operating picture, from check-in to research</h2>
        <p className="mt-2 max-w-3xl text-sm text-gsx-muted">
          This view connects capabilities the current platform can already observe and makes unbuilt parts visible instead of implying they are complete. It is a working command-center foundation, not yet a full tournament, age-verification, media, or payout system.
        </p>
      </Card>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Checked In" value={checkins.length} sub={event.expected_attendance ? `of ${event.expected_attendance} expected` : "event attendees"} />
        <StatCard label="Consent Follow-up" value={consentReview} sub="check-ins without research consent" />
        <StatCard label="Assigned Teams" value={teams.length} sub={`${judges.length} judge(s) on those teams`} />
        <StatCard label="Research Sessions" value={sessions.length} sub={`${eventMentions.length} event sponsor mentions`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <Card>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">Event flow</h2>
              <p className="mt-1 text-xs text-gsx-muted">{tracked} of {steps.length} stages have usable data or a linked capability.</p>
            </div>
            <span className="text-xs text-gsx-muted">Untracked stages are explicit roadmap gaps</span>
          </div>
          <ol className="space-y-0">
            {steps.map((step, index) => {
              const isTracked = ["Tracked", "Staffed", "Package linked", "Ledger ready", "Live roll-up", "Sessions linked", "This view"].includes(step.status);
              const tone = isTracked ? "green" : step.status === "Manual review" || step.status === "Needs assignment" ? "amber" : "gray";
              return (
                <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-gsx-border" />}
                  <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isTracked ? "border-gsx-accent/50 bg-gsx-accent/10 text-gsx-accent" : "border-gsx-border bg-gsx-panel-2 text-gsx-muted"}`}>{index + 1}</span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">{step.title}</h3>
                      <Badge tone={tone}>{step.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gsx-muted">{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold">Staffing & equipment</h2>
            {teams.length ? (
              <ul className="mt-3 space-y-3">
                {teams.map((team) => (
                  <li key={team.id} className="rounded border border-gsx-border bg-gsx-panel-2 p-3">
                    <h3 className="text-sm font-medium">{team.name}</h3>
                    <p className="mt-1 text-xs text-gsx-muted">{(team.members ?? []).map((member) => `${member.person.full_name} (${member.role_on_team})`).join(" · ") || "No roster members"}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-gsx-muted">No field team assigned.</p>}
            <div className="mt-4 border-t border-gsx-border pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gsx-muted">Event equipment</h3>
              {equipment.length ? <ul className="mt-2 space-y-1 text-sm">{equipment.map((item) => <li key={item.id} className="flex justify-between gap-2"><span>{item.name}</span><Badge tone={item.status === "ready" || item.status === "in_use" ? "green" : "amber"}>{item.status.replace("_", " ")}</Badge></li>)}</ul> : <p className="mt-2 text-xs text-gsx-muted">No equipment is specifically assigned to this event.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Sponsor package</h2>
            {sponsorships.length ? (
              <ul className="mt-3 space-y-3">{sponsorships.map((item) => {
                const sponsorPackage = item.package;
                return <li key={item.id} className="rounded border border-gsx-border bg-gsx-panel-2 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{sponsorPackage?.sponsor?.name ?? "Sponsor"}</span><Badge tone="blue">{usd(item.fee_cents)}</Badge></div><p className="mt-1 text-xs text-gsx-muted">{sponsorPackage?.name ?? "Activation package"}</p></li>;
              })}</ul>
            ) : <p className="mt-2 text-sm text-gsx-muted">No sponsor package linked to this event.</p>}
            <p className="mt-3 text-xs text-gsx-muted">{sponsorSetupMissing ? "Apply migration 0005_brand_mentions.sql to enable brand-mention reporting." : `${eventMentions.length} event-linked mention(s).`}</p>
            {!sponsorSetupMissing && <div className="mt-3"><MentionLogger sponsors={sponsors.map((sponsor) => ({ id: sponsor.id, name: sponsor.name }))} eventId={event.id} /></div>}
          </Card>

          <Card>
            <h2 className="font-semibold">Research & safeguards</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gsx-muted">Study</dt><dd className="text-right">{event.study?.title ?? "Not linked"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gsx-muted">Birth year missing</dt><dd className="tabular-nums">{unknownBirthYear}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gsx-muted">No research consent</dt><dd className="tabular-nums">{consentReview}</dd></div>
            </dl>
            <p className="mt-3 rounded border border-gsx-warn/30 bg-gsx-warn/5 p-3 text-xs leading-relaxed text-gsx-muted">Birth year and research consent are not identity or age verification. This platform does not yet have a verified-age gate or parental-consent workflow; do not treat these counts as eligibility clearance.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
