"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MemberMini {
  id: string;
  first_name: string;
  player_number: number | null;
  signature_color_1: string | null;
  signature_color_2: string | null;
}

interface PulseRow {
  game_id: string;
  title: string;
  quadrant: string | null;
  avg_stars: number | null;
  rating_count: number;
}

const QUADRANTS = [
  { code: "q1", label: "Team Ball", tag: "Q1 · Sports / team" },
  { code: "q2", label: "Video", tag: "Q2 · Video games" },
  { code: "q3", label: "Board", tag: "Q3 · Board + paper" },
  { code: "q4", label: "Card & Odd", tag: "Q4 · Card + odd" },
] as const;

export default function MemberPlay({
  member,
  pulse,
  lockouts,
  myRatings,
}: {
  member: MemberMini;
  pulse: PulseRow[];
  lockouts: { game_id: string; quadrant: string | null; expires_at: string }[];
  myRatings: Record<string, number>;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>(myRatings);
  const [busyGame, setBusyGame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lockoutByGame = useMemo(
    () => new Map(lockouts.map((l) => [l.game_id, l.expires_at])),
    [lockouts],
  );

  const days = (iso: string) =>
    Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

  const accent = member.signature_color_1 ?? "#5aa9e6";
  const accent2 = member.signature_color_2 ?? "#ff552e";

  async function rate(gameId: string, stars: number) {
    setBusyGame(gameId);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("catalog_ratings")
      .upsert(
        {
          member_id: member.id,
          game_id: gameId,
          stars,
          quadrant: pulse.find((p) => p.game_id === gameId)?.quadrant ?? null,
        },
        { onConflict: "member_id,game_id" },
      );
    if (upsertError) {
      setError(upsertError.message);
      setBusyGame(null);
      return;
    }
    setRatings((r) => ({ ...r, [gameId]: stars }));
    setBusyGame(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <header className="text-center">
        <div className="gsx-gradient-text text-3xl font-bold tracking-wide">GAMESPEXS</div>
        <p className="mt-1 text-sm text-gsx-muted">
          {member.first_name}&apos;s quadrant matrix
          {member.player_number !== null && (
            <> · Player #{member.player_number}</>
          )}
        </p>
        <Link
          href="/member"
          className="mt-2 inline-block text-xs text-gsx-muted underline hover:text-gsx-text"
        >
          ← back to dashboard
        </Link>
      </header>

      {error && (
        <p className="rounded-lg border border-gsx-danger/30 bg-gsx-danger/10 p-3 text-center text-sm text-gsx-danger">
          {error}
        </p>
      )}

      {/* 2x2 symmetrical matrix — 50/50 partitions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUADRANTS.map((q) => {
          const games = pulse.filter((p) => p.quadrant === q.code);
          const allLocked =
            games.length > 0 && games.every((g) => lockoutByGame.has(g.game_id));
          return (
            <section
              key={q.code}
              className={`flex min-h-[220px] flex-col rounded-xl border p-4 ${
                allLocked
                  ? "border-gsx-danger/30 bg-gsx-panel opacity-70"
                  : "border-gsx-border bg-gsx-panel"
              }`}
              style={allLocked ? undefined : { boxShadow: `inset 3px 0 0 ${q.code === "q2" || q.code === "q4" ? accent2 : accent}` }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{q.label}</h2>
                <span className="text-[10px] uppercase tracking-wider text-gsx-muted">{q.tag}</span>
              </div>

              {allLocked && (
                <div className="mt-2 rounded-lg border border-gsx-danger/30 bg-gsx-danger/10 p-2 text-center text-xs text-gsx-danger">
                  🔒 Quadrant on 14-day cooldown
                </div>
              )}

              <ul className="mt-3 space-y-2">
                {games.length === 0 && (
                  <li className="text-xs text-gsx-muted">No active games here yet.</li>
                )}
                {games.map((g) => {
                  const lockUntil = lockoutByGame.get(g.game_id);
                  const my = ratings[g.game_id];
                  return (
                    <li
                      key={g.game_id}
                      className="rounded-lg border border-gsx-border/60 bg-gsx-panel-2 px-3 py-2"
                      style={lockUntil ? { opacity: 0.55 } : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{g.title}</span>
                        {lockUntil && (
                          <span className="shrink-0 text-[10px] text-gsx-danger">
                            🔒 {days(lockUntil)}d
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-gsx-muted">
                          {g.avg_stars !== null
                            ? `★ ${g.avg_stars} · ${g.rating_count} rating${g.rating_count === 1 ? "" : "s"}`
                            : "No ratings yet"}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              disabled={busyGame === g.game_id || !!lockUntil}
                              onClick={() => rate(g.game_id, star)}
                              aria-label={`Rate ${g.title} ${star} star${star === 1 ? "" : "s"}`}
                              className={`text-base leading-none transition-transform hover:scale-110 disabled:opacity-40 ${
                                (my ?? 0) >= star ? "text-gsx-gold" : "text-gsx-muted/40"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="text-center text-xs text-gsx-muted">
        Finish a study on a game and its whole quadrant locks for 14 days — earn your unlocks
        the GAMESPEXS way.
      </p>
    </div>
  );
}
