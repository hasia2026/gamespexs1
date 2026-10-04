import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import StreetTeamDesk, { type RefOverview } from "@/components/StreetTeamDesk";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

const EMPTY: RefOverview = {
  workers: [],
  totals: {
    workers_active: 0,
    workers_total: 0,
    clicks_7d: 0,
    clicks_total: 0,
    conversions: 0,
    attributed_members: 0,
    members_total: 0,
    owed_cents: 0,
    paid_cents: 0,
  },
};

export default async function StreetTeamPage() {
  if (DEMO_MODE) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Street Team"
          sub="Contractor tracking links with click and conversion logging — the attribution piece of the payouts system."
        />
        <Card>
          <p className="text-sm text-gsx-muted">
            Street-team tracking requires the live database. Connect Supabase and apply
            <span className="font-mono text-xs"> supabase/migrations/0019_ref_tracking.sql</span>.
          </p>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/street-team");

  // Staff gate — mirrors the payouts desk.
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role ?? "";
  const allowed = role === "admin" || role === "executive";

  let overview: RefOverview | null = null;
  if (allowed) {
    const { data } = await supabase.rpc("ref_desk_overview");
    overview = (data ?? null) as RefOverview | null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Street Team"
        sub="Contractor tracking links — every ?ref= click and signup is logged per worker, with commissions posted to the payouts ledger automatically."
      />
      {!allowed ? (
        <Card>
          <p className="text-sm text-gsx-muted">
            Street-team management is restricted to admin and executive staff. Ask an admin if
            you need access.
          </p>
        </Card>
      ) : (
        <StreetTeamDesk initial={overview ?? EMPTY} />
      )}
    </div>
  );
}
