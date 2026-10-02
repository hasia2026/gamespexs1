import Link from "next/link";
import { getCategories, getGames, getMechanics } from "@/lib/data";
import { Badge, Card, PageHeader, Table, Td, EmptyState } from "@/components/ui";
import { NewGameForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const [games, categories, mechanics] = await Promise.all([
    getGames(),
    getCategories(),
    getMechanics(),
  ]);

  const filtered = cat ? games.filter((g) => g.category?.name === cat) : games;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Game Library"
        sub="Every game GAMESPEXS researches, plays, and deploys — tagged by category and mechanic."
      />

      <NewGameForm categories={categories} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/games"
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            !cat ? "border-gsx-accent/40 bg-gsx-accent/10 text-gsx-accent" : "border-gsx-border text-gsx-muted hover:text-gsx-text"
          }`}
        >
          All ({games.length})
        </Link>
        {categories.map((c) => {
          const count = games.filter((g) => g.category?.name === c.name).length;
          return (
            <Link
              key={c.id}
              href={`/games?cat=${encodeURIComponent(c.name)}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                cat === c.name ? "border-gsx-accent/40 bg-gsx-accent/10 text-gsx-accent" : "border-gsx-border text-gsx-muted hover:text-gsx-text"
              }`}
            >
              {c.name} ({count})
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No games in this category" sub="Add games from the Command Center once the library grows." />
      ) : (
        <Table head={["Title", "Category", "Players", "Play time", "Complexity", "Mechanics", "Network"]}>
          {filtered.map((g) => (
            <tr key={g.id} className="hover:bg-gsx-panel-2/50">
              <Td>
                <div className="font-medium">{g.title}</div>
                {g.publisher && <div className="text-xs text-gsx-muted">{g.publisher}{g.year_released ? ` · ${g.year_released}` : ""}</div>}
              </Td>
              <Td><Badge tone="blue">{g.category?.name ?? "—"}</Badge></Td>
              <Td className="tabular-nums">{g.min_players}–{g.max_players}</Td>
              <Td className="tabular-nums">{g.play_minutes ? `${g.play_minutes} min` : "—"}</Td>
              <Td><span className="capitalize">{g.complexity}</span></Td>
              <Td>
                <div className="flex max-w-xs flex-wrap gap-1">
                  {(g.mechanics ?? []).map((m) => (
                    <span key={m.id} className="rounded bg-gsx-panel-2 px-1.5 py-0.5 text-[11px] text-gsx-muted">
                      {m.name}
                    </span>
                  ))}
                </div>
              </Td>
              <Td>
                {g.is_closed_network
                  ? <Badge tone="amber">closed</Badge>
                  : <Badge tone="gray">open</Badge>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold">Categories</h3>
          <p className="mt-1 text-xs text-gsx-muted">{categories.length} families in the library taxonomy.</p>
          <Link href="/games/categories" className="mt-3 inline-block text-xs text-gsx-accent hover:underline">Manage categories →</Link>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">Game Mechanics</h3>
          <p className="mt-1 text-xs text-gsx-muted">{mechanics.length} mechanics linked to games for research analysis.</p>
          <Link href="/games/mechanics" className="mt-3 inline-block text-xs text-gsx-accent hover:underline">Explore mechanics →</Link>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">Closed-Network Titles</h3>
          <p className="mt-1 text-xs text-gsx-muted">{games.filter((g) => g.is_closed_network).length} titles approved for institutional deployment.</p>
        </Card>
      </section>
    </div>
  );
}
