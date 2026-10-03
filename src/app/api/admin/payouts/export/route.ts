import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode as DEMO_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

const W9_THRESHOLD_CENTS = 60000; // $600 / year — IRS 1099-NEC reporting trigger

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type LedgerRow = {
  kind: string;
  status: string;
  payee_label: string | null;
  gross_cents: number;
  participant_cents: number;
  interviewer_cents: number;
  judge_cents: number;
  platform_cents: number;
  amount_cents: number;
  note: string | null;
  paid_at: string | null;
};

type PayeeTotal = {
  payee: string;
  rows: number;
  amount: number;
  gross: number;
  participant: number;
  interviewer: number;
  judge: number;
  platform: number;
  paid_rows: number;
  unpaid_rows: number;
};

/**
 * GET /api/admin/payouts/export
 * Staff-only CSV export of the payouts ledger, totaled by payee with a
 * W9_REQUIRED flag for any payee whose total exceeds $600 (1099-NEC trigger).
 */
export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "The ledger export requires the live database." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Staff gate — same as the payouts page; RLS backs this up at the table level.
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role ?? "";
  if (role !== "admin" && role !== "executive") {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("payout_ledger")
    .select(
      "kind,status,payee_label,gross_cents,participant_cents,interviewer_cents,judge_cents,platform_cents,amount_cents,note,paid_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as LedgerRow[];

  // Total per payee; flag anyone over the $600 / year reporting threshold.
  const totals = new Map<string, PayeeTotal>();
  for (const r of rows) {
    const payee = r.payee_label ?? "(unassigned)";
    const t =
      totals.get(payee) ??
      {
        payee,
        rows: 0,
        amount: 0,
        gross: 0,
        participant: 0,
        interviewer: 0,
        judge: 0,
        platform: 0,
        paid_rows: 0,
        unpaid_rows: 0,
      };
    t.rows += 1;
    t.amount += r.amount_cents;
    t.gross += r.gross_cents;
    t.participant += r.participant_cents;
    t.interviewer += r.interviewer_cents;
    t.judge += r.judge_cents;
    t.platform += r.platform_cents;
    if (r.status === "paid") t.paid_rows += 1;
    else if (r.status === "computed") t.unpaid_rows += 1;
    totals.set(payee, t);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push("GAMESPEXS Payouts Ledger Export");
  lines.push(`Generated,${stamp}`);
  lines.push(
    `W-9 rule,"Payees totaling over ${usd(W9_THRESHOLD_CENTS)} in a year require a W-9 on file (IRS 1099-NEC)"`,
  );
  lines.push("");

  // Section 1 — per-payee totals (the tax-question view).
  lines.push("PAYEE TOTALS");
  lines.push(
    "Payee,Entries,Paid Entries,Unpaid Entries,Total Amount USD,Gross USD,Participant USD,Interviewer USD,Judge USD,Platform USD,W9_REQUIRED",
  );
  const sorted = [...totals.values()].sort((a, b) => b.amount - a.amount);
  for (const t of sorted) {
    const flag = t.amount > W9_THRESHOLD_CENTS ? "W9_REQUIRED" : "";
    lines.push(
      [
        csvCell(t.payee),
        t.rows,
        t.paid_rows,
        t.unpaid_rows,
        usd(t.amount),
        usd(t.gross),
        usd(t.participant),
        usd(t.interviewer),
        usd(t.judge),
        usd(t.platform),
        flag,
      ].join(","),
    );
  }
  const grand = sorted.reduce(
    (acc, t) => ({
      amount: acc.amount + t.amount,
      gross: acc.gross + t.gross,
      participant: acc.participant + t.participant,
      interviewer: acc.interviewer + t.interviewer,
      judge: acc.judge + t.judge,
      platform: acc.platform + t.platform,
    }),
    { amount: 0, gross: 0, participant: 0, interviewer: 0, judge: 0, platform: 0 },
  );
  lines.push(
    [
      "TOTAL",
      rows.length,
      sorted.reduce((a, t) => a + t.paid_rows, 0),
      sorted.reduce((a, t) => a + t.unpaid_rows, 0),
      usd(grand.amount),
      usd(grand.gross),
      usd(grand.participant),
      usd(grand.interviewer),
      usd(grand.judge),
      usd(grand.platform),
      "",
    ].join(","),
  );

  // Section 2 — full transaction detail for the accountant.
  lines.push("");
  lines.push("TRANSACTION DETAIL");
  lines.push(
    "Kind,Status,Payee,Gross USD,Participant USD,Interviewer USD,Judge USD,Platform USD,Amount USD,Note,Paid At",
  );
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.kind),
        csvCell(r.status),
        csvCell(r.payee_label ?? "(unassigned)"),
        usd(r.gross_cents),
        usd(r.participant_cents),
        usd(r.interviewer_cents),
        usd(r.judge_cents),
        usd(r.platform_cents),
        usd(r.amount_cents),
        csvCell(r.note ?? ""),
        csvCell(r.paid_at ?? ""),
      ].join(","),
    );
  }

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gamespexs-payouts-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
