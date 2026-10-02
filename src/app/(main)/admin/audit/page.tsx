import { getAuditLog } from "@/lib/data";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const entries = await getAuditLog();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        sub="Every mutation on core tables is captured automatically by database triggers."
      />

      {entries.length === 0 ? (
        <EmptyState title="No audit entries" sub="Activity will appear here as data changes." />
      ) : (
        <Table head={["When", "Table", "Record", "Action"]}>
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-gsx-panel-2/50">
              <Td className="whitespace-nowrap text-gsx-muted">
                {new Date(e.occurred_at).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </Td>
              <Td className="font-mono text-xs">{e.table_name}</Td>
              <Td className="font-mono text-xs text-gsx-muted">{e.record_id ?? "—"}</Td>
              <Td>
                <Badge tone={e.action === "DELETE" ? "red" : e.action === "UPDATE" ? "amber" : "green"}>
                  {e.action}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
