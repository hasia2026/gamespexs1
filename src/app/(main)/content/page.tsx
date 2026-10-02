import Link from "next/link";
import { getContentItems, getGames, getPeople, getStudies } from "@/lib/data";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, statusTone } from "@/components/ui";
import { NewContentForm } from "@/components/forms";

export const dynamic = "force-dynamic";

const TYPE_GLYPHS: Record<string, string> = {
  article: "📰",
  video: "🎬",
  photo: "📷",
  game_guide: "📖",
  press: "📣",
  other: "📄",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const [items, people, games, studies] = await Promise.all([
    getContentItems(), getPeople(), getGames(), getStudies(),
  ]);

  const filtered =
    statusFilter && ["draft", "review", "published"].includes(statusFilter)
      ? items.filter((i) => i.status === statusFilter)
      : items;

  const published = items.filter((i) => i.status === "published");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        sub="Articles, videos, photography, and game guides — the media library."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Published" value={published.length} />
        <StatCard label="In Review" value={items.filter((i) => i.status === "review").length} />
        <StatCard label="Drafts" value={items.filter((i) => i.status === "draft").length} />
        <StatCard label="Total Items" value={items.length} />
      </section>

      <NewContentForm
        people={people.map((p) => ({ id: p.id, full_name: p.full_name }))}
        games={games.map((g) => ({ id: g.id, title: g.title }))}
        studies={studies.map((s) => ({ id: s.id, code: s.code }))}
      />

      <nav className="flex flex-wrap gap-2">
        {[
          { key: "", label: "All" },
          { key: "draft", label: "Drafts" },
          { key: "review", label: "In review" },
          { key: "published", label: "Published" },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/content?status=${f.key}` : "/content"}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              (statusFilter ?? "") === f.key
                ? "border-gsx-accent/40 bg-gsx-accent/10 text-gsx-accent"
                : "border-gsx-border text-gsx-muted hover:text-gsx-text"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState title="No content yet" sub="Create the first article, guide, or media item above." />
      ) : (
        <Table head={["", "Title", "Type", "Author", "Linked to", "Date", "Status"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-gsx-panel-2/50">
              <Td>{TYPE_GLYPHS[c.content_type] ?? "📄"}</Td>
              <Td>
                <Link href={`/content/${c.id}`} className="font-medium hover:text-gsx-accent">
                  {c.title}
                </Link>
              </Td>
              <Td><span className="capitalize">{c.content_type.replace("_", " ")}</span></Td>
              <Td className="text-gsx-muted">{c.author?.full_name ?? "—"}</Td>
              <Td className="text-xs text-gsx-muted">
                {c.game?.title ?? c.study?.code ?? "—"}
              </Td>
              <Td className="whitespace-nowrap text-gsx-muted">
                {c.published_at
                  ? new Date(c.published_at).toLocaleDateString()
                  : c.status === "draft"
                    ? "—"
                    : new Date(c.published_at ?? c.id ? Date.now() : Date.now()).toLocaleDateString()}
              </Td>
              <Td><Badge tone={statusTone(c.status)}>{c.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
