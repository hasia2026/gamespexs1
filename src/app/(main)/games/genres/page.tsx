import { getCategories, getGames } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * MASTER GENRES — the taxonomy view (Steve's Master Genre Database).
 * The 10 primary genres are the game_categories rows; each card lists the
 * subgenres described in the category and the library games filed under it.
 */
export default async function GenresPage() {
  const [categories, games] = await Promise.all([getCategories(), getGames()]);

  const items = categories.map((c) => {
    const desc = c.description ?? "";
    const subIdx = desc.indexOf("Subgenres:");
    const blurb = subIdx >= 0 ? desc.slice(0, subIdx).trim() : desc;
    const subText = subIdx >= 0 ? desc.slice(subIdx + "Subgenres:".length).trim() : "";
    const subGenres = subText
      ? subText
          .split(/;|\.(?=\s+[A-Z])/)
          .map((s) => s.trim().replace(/\.$/, ""))
          .filter((s) => s.length > 0 && s.toLowerCase() !== "subgenres")
      : [];
    return { ...c, blurb, subGenres, games: games.filter((g) => g.category_id === c.id) };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Genres"
        sub="The master taxonomy: 10 primary genres, every subgenre categorized, one structural home for every activity a participant enjoys."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c, i) => (
          <section
            key={c.id}
            className={"rounded-xl border border-gsx-border bg-gsx-panel p-4 " + (i % 5 === 4 ? "xl:border-gsx-gold/40" : "")}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold">
                <span className="mr-2 font-mono text-xs text-gsx-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {c.name}
              </h3>
              <span className="shrink-0 text-xs tabular-nums text-gsx-muted">
                {c.games.length} game{c.games.length === 1 ? "" : "s"}
              </span>
            </div>

            {c.blurb && <p className="mt-2 text-sm text-gsx-text/90">{c.blurb}</p>}

            {c.subGenres.length > 0 && (
              <ul className="mt-3 space-y-1">
                {c.subGenres.map((s) => (
                  <li key={s} className="flex gap-2 text-[13px] text-gsx-muted">
                    <span className="text-gsx-accent/60">▸</span>
                    <span className="min-w-0">{s}</span>
                  </li>
                ))}
              </ul>
            )}

            {c.games.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {c.games.slice(0, 5).map((g) => (
                  <span key={g.id} className="rounded bg-gsx-panel-2 px-1.5 py-0.5 text-[11px] text-gsx-muted">
                    {g.title}
                  </span>
                ))}
                {c.games.length > 5 && (
                  <span className="rounded bg-gsx-panel-2 px-1.5 py-0.5 text-[11px] text-gsx-muted">
                    +{c.games.length - 5} more
                  </span>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="text-xs text-gsx-muted">
        Members rate games through the quadrant matrix at /member/play; this taxonomy is the
        organizing frame behind those ratings and the star-question banks in the Launch Library.
      </p>
    </div>
  );
}
