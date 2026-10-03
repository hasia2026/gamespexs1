import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import PayoutsLedger, { type LedgerOverview } from "@/components/PayoutsLedger";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

const EMPTY: LedgerOverview = { by_kind: [], recent: [] };

export default async function PayoutsPage() {
  if (DEMO_MODE) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payouts Ledger"
          sub="Blueprint money rules, automated: study ⅓-⅓-⅓ splits, judge session percentages, street-team commissions."
        />
        <Card>
          <p className="text-sm text-gsx-muted">
            The ledger requires the live database. Connect Supabase and apply
            <span className="font-mono text-xs"> supabase/migrations/0014_payout_ledger.sql</span>.
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
  if (!user) redirect("/login?next=/admin/payouts");

  // Staff gate — payouts are admin/executive business (also enforced by every ledger RPC).
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role ?? "";
  const allowed = role === "admin" || role === "executive";

  let overview: LedgerOverview | null = null;
  if (allowed) {
    const { data } = await supabase.rpc("ledger_overview");
    overview = (data ?? null) as LedgerOverview | null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts Ledger"
        sub="Blueprint money rules, automated: study ⅓-⅓-⅓ splits, judge session percentages, street-team commissions."
      />
      {!allowed ? (
        <Card>
          <p className="text-sm text-gsx-muted">
            Payouts are restricted to admin and executive staff (blueprint: the Payroll
            Specialist desk). Ask an admin if you need access.
          </p>
        </Card>
      ) : (
        <PayoutsLedger initial={overview ?? EMPTY} />
      )}
    </div>
  );
}
