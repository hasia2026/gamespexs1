import { getParticipants, getSessions } from "@/lib/data";
import { Badge, PageHeader, Table, Td } from "@/components/ui";
import { NewParticipantForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const [participants, sessions] = await Promise.all([getParticipants(), getSessions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participants"
        sub="Consent-tracked research participants. Sessions link participants to games and surveys."
      />
      <NewParticipantForm />
      <Table head={["Code", "Birth Year", "Gender", "City", "County", "Sessions", "Consent"]}>
        {participants.map((p) => {
          const n = sessions.filter((s) => s.participant_id === p.id).length;
          return (
            <tr key={p.id} className="hover:bg-gsx-panel-2/50">
              <Td className="font-mono text-xs text-gsx-accent-2">{p.code}</Td>
              <Td className="tabular-nums">{p.birth_year ?? "—"}</Td>
              <Td>{p.gender ?? "—"}</Td>
              <Td>{p.city ?? "—"}</Td>
              <Td className="text-gsx-muted">{p.county ?? "—"}</Td>
              <Td className="tabular-nums">{n}</Td>
              <Td>
                {p.consent_given
                  ? <Badge tone="green">consented</Badge>
                  : <Badge tone="amber">pending</Badge>}
              </Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
