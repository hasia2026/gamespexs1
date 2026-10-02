import Link from "next/link";
import { getGames, getLocations, getParticipants, getSessions, getStudies } from "@/lib/data";
import { Badge, PageHeader, Table, Td, statusTone } from "@/components/ui";
import { NewSessionForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const [sessions, studies, participants, games, locations] = await Promise.all([
    getSessions(), getStudies(), getParticipants(), getGames(), getLocations(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Sessions"
        sub="One session = one participant, one game, one context. Surveys and metrics hang off these."
      />
      <NewSessionForm
        studies={studies}
        participants={participants}
        games={games.map((g) => ({ id: g.id, title: g.title }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
      <Table head={["Date", "Participant", "Game", "Study", "Channel", "Duration", "Status", ""]}>
        {sessions.map((s) => (
          <tr key={s.id} className="hover:bg-gsx-panel-2/50">
            <Td className="whitespace-nowrap text-gsx-muted">
              {new Date(s.session_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Td>
            <Td className="font-mono text-xs">{s.participant?.code ?? "—"}</Td>
            <Td className="font-medium">{s.game?.title ?? "—"}</Td>
            <Td className="font-mono text-xs text-gsx-accent-2">{s.study?.code ?? "—"}</Td>
            <Td><span className="capitalize">{s.channel.replace("_", " ")}</span></Td>
            <Td className="tabular-nums">{s.duration_minutes ?? "—"} min</Td>
            <Td><Badge tone={statusTone(s.status)}>{s.status}</Badge></Td>
            <Td>
              <Link
                href={`/research/sessions/${s.id}`}
                className="text-xs text-gsx-accent hover:underline"
              >
                Detail →
              </Link>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
