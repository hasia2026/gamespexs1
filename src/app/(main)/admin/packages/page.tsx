import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import CorporatePackages, { type CorporateOrder } from "@/components/CorporatePackages";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function CorporatePackagesPage() {
  if (DEMO_MODE) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Corporate Packages"
          sub="$333 / 10 players and $3,330 / 100 players — recorded sales split the ledger automatically."
        />
        <Card>
          <p className="text-sm text-gsx-muted">
            Corporate packages require the live database. Connect Supabase and apply
            <span className="font-mono text-xs"> supabase/migrations/0018_corporate_packages.sql</span>.
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
  if (!user) redirect("/login?next=/admin/packages");

  // Staff gate — corporate sales are admin/executive business (mirrors the payouts desk).
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role ?? "";
  const allowed = role === "admin" || role === "executive";

  let orders: CorporateOrder[] = [];
  if (allowed) {
    const { data } = await supabase
      .from("corporate_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    orders = (data ?? []) as CorporateOrder[];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Packages"
        sub="$333 / 10 players · $3,330 / 100 players. One click stores the sale, splits the gross into thirds, and posts the $10-per-seat charity allocation."
      />
      {!allowed ? (
        <Card>
          <p className="text-sm text-gsx-muted">
            Corporate sales are restricted to admin and executive staff. Ask an admin if you
            need access.
          </p>
        </Card>
      ) : (
        <CorporatePackages initial={orders} />
      )}
    </div>
  );
}
