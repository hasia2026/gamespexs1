import { getGames, getMechanics } from "@/lib/data";
import { Badge, Card, PageHeader, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MechanicsPage() {
  const [mechanics, games] = await Promise.all([getMechanics(), getGames()]);

  const rows = mechanics.map((m) => {
    const usedBy = games.filter((g) => (g.mechanics ?? []).some((gm) => gm.id === m.id));
    return { mechanic: m, usedBy };
  }).sort((a, b) => b.usedBy.length - a.usedBy.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Game Mechanics"
        sub="The research handles: which mechanics a game exercises determines what it can teach us."
      />

      <Table head={["Mechanic", "Description", "Games", "Sample Titles"]}>
        {rows.map(({ mechanic: m, usedBy }) => (
          <tr key={m.id} className="hover:bg-gsx-panel-2/50">
            <Td className="font-medium">{m.name}</Td>
            <Td className="text-gsx-muted">{m.description ?? "—"}</Td>
            <Td><Badge tone={usedBy.length > 1 ? "green" : "blue"}>{usedBy.length}</Badge></Td>
            <Td className="text-gsx-muted">{usedBy.slice(0, 3).map((g) => g.title).join(", ") || "—"}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
