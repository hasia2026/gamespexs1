import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentItems } from "@/lib/data";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Minimal markdown renderer for the limited formatting used in bodies:
 *  ## headings, **bold**, and paragraphs. Dependency-free by design. */
function renderMarkdown(md: string) {
  return md.split(/\n{2,}/).map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="mt-6 border-b border-gsx-border pb-1 text-lg font-semibold first:mt-0">
          {block.slice(3)}
        </h2>
      );
    }
    const parts = block.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p,
    );
    return (
      <p key={i} className="mt-3 leading-relaxed text-gsx-muted">
        {parts}
      </p>
    );
  });
}

export default async function ContentReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await getContentItems();
  const item = items.find((c) => c.id === id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="print:hidden">
        <Link href="/content" className="text-sm text-gsx-accent hover:underline">
          ← Back to Content
        </Link>
      </div>

      <PageHeader
        title={item.title}
        sub={[
          item.author?.full_name,
          item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Unpublished",
          item.game ? `Game: ${item.game.title}` : null,
          item.study ? `Study: ${item.study.code}` : null,
        ].filter(Boolean).join(" · ")}
        actions={<Badge tone={statusTone(item.status)}>{item.status}</Badge>}
      />

      {item.media_url && (
        <Card>
          <p className="text-sm">Media:{" "}
            <a href={item.media_url} className="text-gsx-accent hover:underline" target="_blank" rel="noreferrer">
              {item.media_url}
            </a>
          </p>
        </Card>
      )}

      <article className="rounded-lg border border-gsx-border bg-gsx-panel p-6">
        {item.body_md ? (
          renderMarkdown(item.body_md)
        ) : (
          <p className="text-sm text-gsx-muted">No body written yet.</p>
        )}
      </article>
    </div>
  );
}
