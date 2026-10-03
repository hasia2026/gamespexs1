import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardStats, getFindings, getMembershipChoices, getSessions, getStudies } from "@/lib/data";
import { getActiveProfile } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader, StatCard, Table, Td, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CommandCenter() {
  // Sponsor contacts live in the read-only partner portal, not the staff console.
  const profile = await getActiveProfile();
  if (profile?.role === "sponsor") redirect("/portal");

  // Members have no staff profile — land them on their one-page dashboard
  // instead of an empty staff console.
  if (!profile) {
    const supabase = await createClient();
    if (supabase) {
      const { data: mm } = await supabase.rpc("member_me");
      if ((mm as { ok?: boolean } | null)?.ok) redirect("/member");
    }
  }

  const [stats, studies, sessions, findings, choices] = await Promise.all([
    getDashboardStats(),
    getStudies(),
    getSessions(),
    getFindings(),
    getMembershipChoices(),
  ]);

  const activeStudies = studies.filter((s) => s.status === "active");
  const recentSessions = sessions.slice(0, 8);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        sub="Live overview of research activity, operations, and the game library."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Active Studies" value={stats.active_studies} sub={`${studies.length} total`} />
        <StatCard label="Participants" value={stats.total_participants} sub="consented" />
        <StatCard label="Sessions" value={stats.sessions_total} sub={`${stats.sessions_this_month} this month`} />
        <StatCard label="Responses" value={stats.responses_captured} sub="survey answers" />
        <StatCard label="Metrics" value={stats.metrics_captured} sub="behavioral datapoints" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Research Sessions</h2>
            <Link href="/research/sessions" className="text-xs text-gsx-accent hover:underline">
              View all →
            </Link>
          </div>
          <Table head={["Participant", "Game", "Channel", "Duration", "Date", "Status"]}>
            {recentSessions.map((s) => (
              <tr key={s.id} className="hover:bg-gsx-panel-2/50">
                <Td>{s.participant?.display_name ?? s.participant?.code}</Td>
                <Td className="font-medium">{s.game?.title}</Td>
                <Td><span className="capitalize">{s.channel.replace("_", " ")}</span></Td>
                <Td className="tabular-nums">{s.duration_minutes} min</Td>
                <Td className="text-gsx-muted">{new Date(s.session_date).toLocaleDateString()}</Td>
                <Td><Badge tone={statusTone(s.status)}>{s.status}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Active Studies</h2>
              <Link href="/research/studies" className="text-xs text-gsx-accent hover:underline">
                All studies →
              </Link>
            </div>
            <div className="space-y-3">
              {activeStudies.map((st) => (
                <div key={st.id} className="rounded border border-gsx-border bg-gsx-panel-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-gsx-accent-2">{st.code}</span>
                    <Badge tone={statusTone(st.status)}>{st.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm font-medium">{st.title}</div>
                  {st.research_question && (
                    <p className="mt-1 line-clamp-2 text-xs text-gsx-muted">{st.research_question}</p>
                  )}
                </div>
              ))}
              {activeStudies.length === 0 && (
                <p className="text-sm text-gsx-muted">No active studies.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Library & Network</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gsx-muted">Games tracked</dt><dd className="tabular-nums">{stats.games_tracked}</dd></div>
              <div className="flex justify-between"><dt className="text-gsx-muted">Active people</dt><dd className="tabular-nums">{stats.people_count}</dd></div>
              <div className="flex justify-between"><dt className="text-gsx-muted">Locations</dt><dd className="tabular-nums">{stats.locations_count}</dd></div>
            </dl>
          </Card>

          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold">Membership choices</h2>
              <span className="tabular-nums text-xs text-gsx-muted">{choices.total_members} members</span>
            </div>
            <p className="mb-4 text-xs text-gsx-muted">Left open by design — watch what members pick.</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gsx-muted">Standard · $2.25</dt><dd className="tabular-nums">{choices.standard}</dd></div>
              <div className="flex justify-between"><dt className="text-gsx-muted">Premium · $110.00</dt><dd className="tabular-nums">{choices.premium}</dd></div>
              <div className="flex justify-between"><dt className="text-gsx-muted">Both · $112.25</dt><dd className="tabular-nums font-semibold text-gsx-gold">{choices.both}</dd></div>
              <div className="flex justify-between border-t border-gsx-border pt-2">
                <dt className="text-gsx-muted">Collected</dt>
                <dd className="tabular-nums">${(choices.collected_cents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gsx-muted">Charity ledger</dt>
                <dd className="tabular-nums text-gsx-gold">${(choices.charity_cents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-gsx-border pt-2">
                <dt className="text-gsx-muted">18+ attested</dt>
                <dd className="tabular-nums">{choices.attested_18}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gsx-muted">18+ ID-verified</dt>
                <dd className="tabular-nums text-gsx-gold">{choices.verified_18}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Latest Findings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {findings.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{f.title}</h3>
                <Badge tone={statusTone(f.confidence)}>{f.confidence}</Badge>
              </div>
              {f.summary && <p className="mt-2 text-sm text-gsx-muted">{f.summary}</p>}
            </Card>
          ))}
          {findings.length === 0 && (
            <Card><p className="text-sm text-gsx-muted">No findings recorded yet.</p></Card>
          )}
        </div>
      </section>
    </div>
  );
}
