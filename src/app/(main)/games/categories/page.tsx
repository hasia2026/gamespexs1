import { getCategories, getGames } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, games] = await Promise.all([getCategories(), getGames()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Game Categories" sub="The blueprint's game families form the library taxonomy." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const titles = games.filter((g) => g.category_id === c.id).map((g) => g.title);
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{c.name}</h3>
                <span className="text-xs tabular-nums text-gsx-muted">{titles.length} games</span>
              </div>
              {c.description && <p className="mt-1 text-xs text-gsx-muted">{c.description}</p>}
              {titles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {titles.slice(0, 4).map((t) => (
                    <span key={t} className="rounded bg-gsx-panel-2 px-1.5 py-0.5 text-[11px] text-gsx-muted">{t}</span>
                  ))}
                  {titles.length > 4 && (
                    <span className="rounded bg-gsx-panel-2 px-1.5 py-0.5 text-[11px] text-gsx-muted">+{titles.length - 4} more</span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
