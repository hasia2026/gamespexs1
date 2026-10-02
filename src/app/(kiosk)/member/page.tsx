import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";
import MemberDashboard, {
  type LeaderRow,
  type ShoutRow,
} from "@/components/MemberDashboard";

export const dynamic = "force-dynamic";

interface MemberInfo {
  first_name: string;
  last_initial: string;
  player_number: number | null;
  tier: string;
  paid_cents: number;
  consent_status: "free_look" | "locked_bubble";
  free_look_ends_at: string;
  seconds_remaining: number;
  signature_color_1: string | null;
  signature_color_2: string | null;
}

export default async function MemberPage() {
  if (DEMO_MODE) {
    return (
      <div className="w-full max-w-md py-20 text-center">
        <div className="gsx-gradient-text text-2xl font-bold">GAMESPEXS</div>
        <p className="mt-3 text-sm text-gsx-muted">
          Membership requires the live database. Connect Supabase and join at{" "}
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
  if (!user) redirect("/login?next=/member");

  const { data: raw } = await supabase.rpc("member_me");
  const snap = (raw ?? null) as { ok: boolean; member?: MemberInfo } | null;

  if (!snap?.ok || !snap.member) {
    // Authenticated but not a member: staff account or unknown account.
    redirect("/");
  }

  // Founding-1,000 leaderboard + sponsor shout-out ticker (both definer RPCs).
  const [{ data: lbRaw }, { data: shoutRaw }] = await Promise.all([
    supabase.rpc("founding_leaderboard"),
    supabase.rpc("sponsor_shoutouts"),
  ]);
  const leaderboard = (lbRaw ?? null) as {
    leaders: LeaderRow[];
    member_count: number;
    founding_capacity: number;
  } | null;
  const shoutouts = (shoutRaw ?? null) as ShoutRow[] | null;

  return (
    <MemberDashboard
      initial={snap.member}
      leaderboard={leaderboard ?? undefined}
      shoutouts={shoutouts ?? undefined}
    />
  );
}
