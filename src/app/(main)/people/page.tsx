import { getPeople } from "@/lib/data";
import { Badge, Card, PageHeader, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await getPeople();
  const types = [...new Set(people.map((p) => p.person_type))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        sub="Employees, contractors, researchers, interviewers, judges, and community workers."
      />

      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <Badge key={t} tone="blue">
            <span className="capitalize">{t.replace("_", " ")}</span>
            <span className="ml-1 tabular-nums opacity-70">
              {people.filter((p) => p.person_type === t).length}
            </span>
          </Badge>
        ))}
      </div>

      <Table head={["Name", "Type", "Email", "Status"]}>
        {people.map((p) => (
          <tr key={p.id} className="hover:bg-gsx-panel-2/50">
            <Td className="font-medium">{p.full_name}</Td>
            <Td><span className="capitalize">{p.person_type.replace("_", " ")}</span></Td>
            <Td className="text-gsx-muted">{p.email ?? "—"}</Td>
            <Td>
              {p.is_active
                ? <Badge tone="green">active</Badge>
                : <Badge tone="gray">inactive</Badge>}
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
