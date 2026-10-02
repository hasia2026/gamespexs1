import { getSessions, getStudies } from "@/lib/data";
import { Badge, PageHeader, Table, Td, statusTone } from "@/components/ui";
import { NewStudyForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function StudiesPage() {
  const [studies, sessions] = await Promise.all([getStudies(), getSessions()]);
  const sessionCount = (id: string) => sessions.filter((s) => s.study_id === id).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studies"
        sub="Every research question GAMESPEXS is pursuing, with live session counts."
      />
      <NewStudyForm />
      <Table head={["Code", "Title", "Research Question", "Window", "Sessions", "Status", "Export"]}>
        {studies.map((s) => (
          <tr key={s.id} className="hover:bg-gsx-panel-2/50">
            <Td className="whitespace-nowrap font-mono text-xs text-gsx-accent-2">{s.code}</Td>
            <Td className="font-medium">{s.title}</Td>
            <Td className="max-w-sm text-gsx-muted">{s.research_question ?? "—"}</Td>
            <Td className="whitespace-nowrap text-gsx-muted">
              {s.starts_on ?? "—"} → {s.ends_on ?? "open"}
            </Td>
            <Td className="tabular-nums">{sessionCount(s.id)}</Td>
            <Td><Badge tone={statusTone(s.status)}>{s.status}</Badge></Td>
            <Td>
              <a
                href={`/research/studies/${s.id}/export`}
                className="rounded border border-gsx-border bg-gsx-panel-2 px-2 py-1 text-xs text-gsx-accent hover:border-gsx-accent/40"
              >
                CSV ↓
              </a>
            </Td>
          </tr>
        ))}
      </Table>
      <p className="text-xs text-gsx-muted">
        Exports are de-identified: participant codes only — no names, birth years,
        genders, or contact details leave the platform.
      </p>
    </div>
  );
}
