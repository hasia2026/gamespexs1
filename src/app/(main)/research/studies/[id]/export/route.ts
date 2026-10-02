import { getStudyExportData } from "@/lib/data";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * De-identified export (blueprint data-auditing function): participant codes
 * only — no names, birth years, genders, or locations leave the platform.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { study, sessions, survey, questions, responses } = await getStudyExportData(id);
  if (!study) return new Response("Study not found", { status: 404 });

  const header = [
    "study_code",
    "participant_code",
    "session_date",
    "game",
    "channel",
    "duration_minutes",
    ...questions.map((q) => `q${q.ordinal}`),
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const s of sessions) {
    const row = [
      study.code,
      s.participant?.code ?? "",
      s.session_date.slice(0, 10),
      s.game?.title ?? "",
      s.channel,
      s.duration_minutes ?? "",
    ];
    for (const q of questions) {
      const r = responses.find(
        (x) => x.session_id === s.id && x.question_id === q.id,
      );
      row.push(r ? String(r.response_value ?? "") : "");
    }
    lines.push(row.map(csvCell).join(","));
  }

  const filename = `${study.code.replace(/[^\w.-]/g, "_")}-deidentified.csv`;
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
