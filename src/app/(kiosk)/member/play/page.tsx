import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";
import MemberPlay from "@/components/MemberPlay";

export const dynamic = "force-dynamic";

interface MemberInfo {
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

export default async function MemberPlayPage() {
  if (DEMO_MODE) {
    return (
      <div className="w-full max-w-md py-20 text-center">
        <div className="gsx-gradient-text text-2xl font-bold">GAMESPEXS</div>
        <p className="mt-3 text-sm text-gsx-muted">
          The quadrant matrix needs the live database. Connect Supabase and join at{" "}
          <a href="/join" className="text-gsx-accent underline">/join</a>.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/play");

  const { data: raw } = await supabase.rpc("member_me");
  const snap = (raw ?? null) as { ok: boolean; member?: MemberInfo } | null;
  if (!snap?.ok || !snap.member) redirect("/");

  const [pulseRes, lockoutRes, ratingsRes] = await Promise.all([
    supabase.rpc("catalog_pulse"),
    supabase
      .from("genre_lockouts")
      .select("game_id, quadrant, expires_at")
      .gt("expires_at", new Date().toISOString()),
    supabase.from("catalog_ratings").select("game_id, stars"),
  ]);

  return (
    <MemberPlay
      member={snap.member}
      pulse={(pulseRes.data ?? []) as PulseRow[]}
      lockouts={(lockoutRes.data ?? []) as { game_id: string; quadrant: string | null; expires_at: string }[]}
      myRatings={Object.fromEntries(
        ((ratingsRes.data ?? []) as { game_id: string; stars: number }[]).map((r) => [r.game_id, r.stars]),
      )}
    />
  );
}
