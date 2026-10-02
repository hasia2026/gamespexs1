import { getMechanicInsights } from "@/lib/data";
import { Badge, Card, EmptyState, PageHeader, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MechanicInsightsPage() {
  const rows = await getMechanicInsights();

  const withEng = rows.filter((r) => r.engagement !== null);
  const bestEng = withEng.length
    ? withEng.reduce((a, b) => ((b.engagement ?? 0) > (a.engagement ?? 0) ? b : a))
    : null;
  const withRt = rows.filter((r) => r.reaction_ms !== null);
  const bestRt = withRt.length
    ? withRt.reduce((a, b) => ((b.reaction_ms ?? 0) < (a.reaction_ms ?? 0) ? b : a))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mechanic Insights"
        sub="Which game mechanics drive engagement — the flagship research question, answered across every session."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No mechanic data yet"
          sub="Tag games with mechanics in the Game Library; insights appear once sessions record metrics."
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="text-xs uppercase tracking-wider text-gsx-muted">Most-played mechanic</div>
              <div className="mt-1 text-lg font-semibold">{rows[0]?.mechanic ?? "—"}</div>
              <div className="text-xs text-gsx-muted">{rows[0]?.sessions ?? 0} sessions</div>
            </Card>
            <Card>
              <div className="text-xs uppercase tracking-wider text-gsx-muted">Highest engagement</div>
              <div className="mt-1 text-lg font-semibold text-gsx-accent">{bestEng?.mechanic ?? "—"}</div>
              <div className="text-xs text-gsx-muted">
                {bestEng ? `${bestEng.engagement?.toFixed(2)} avg engagement score` : "no data"}
              </div>
            </Card>
            <Card>
              <div className="text-xs uppercase tracking-wider text-gsx-muted">Fastest reactions</div>
              <div className="mt-1 text-lg font-semibold text-gsx-accent-2">{bestRt?.mechanic ?? "—"}</div>
              <div className="text-xs text-gsx-muted">
                {bestRt ? `${bestRt.reaction_ms?.toFixed(0)} ms average` : "no data"}
              </div>
            </Card>
          </section>

          <Table head={["Mechanic", "Sessions", "Engagement", "Reaction (ms)", "Persistence", "Games"]}>
            {rows.map((r) => (
              <tr key={r.mechanic_id} className="hover:bg-gsx-panel-2/50">
                <Td className="font-medium">{r.mechanic}</Td>
                <Td className="tabular-nums">{r.sessions}</Td>
                <Td>
                  <span className="tabular-nums">{r.engagement?.toFixed(2) ?? "—"}</span>
                  {bestEng?.mechanic_id === r.mechanic_id && <Badge tone="green"> best</Badge>}
                </Td>
                <Td className="tabular-nums">
                  {r.reaction_ms?.toFixed(0) ?? "—"}
                  {bestRt?.mechanic_id === r.mechanic_id && <Badge tone="blue"> fastest</Badge>}
                </Td>
                <Td className="tabular-nums">{r.persistence?.toFixed(1) ?? "—"}</Td>
                <Td className="max-w-xs text-xs text-gsx-muted">{r.games.join(", ") || "—"}</Td>
              </tr>
            ))}
          </Table>

          <Card>
            <p className="text-xs text-gsx-muted">
              Method: every research session is attributed to the mechanics tagged on its game
              (games carry multiple mechanics). Engagement score, reaction time, and persistence
              events are averaged across all sessions of games carrying each mechanic. Reaction
              time is inverted — lower is better.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
