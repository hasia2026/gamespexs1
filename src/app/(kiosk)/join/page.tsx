import { JoinForm } from "@/components/JoinForm";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Addendum Q2: guests clicking a paid-study link land here with ?paid=1,
  // which opens the upgrade-window modal choice ($2.25 base vs $110 premium).
  const params = await searchParams;
  const fromPaidStudy = params.paid === "1" || params.paid === "true";

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <div className="text-center">
        <div className="gsx-gradient-text text-3xl font-bold tracking-wide">GAMESPEXS</div>
        <p className="mt-1 text-sm text-gsx-muted">we will bring games to you and talk about it</p>
        <p className="mt-3 text-xs italic text-gsx-gold">
          In games you get another life, in life you get another game!!!!!
        </p>
      </div>

      {/* Mandatory header-placement consent clause (blueprint) */}
      <div className="mt-6 rounded-lg border border-gsx-border bg-gsx-panel p-4 text-xs leading-relaxed text-gsx-muted">
        By initiating membership, users explicitly grant permission to run surveys
        strictly under their designated bubble. Walk-in traffic is restricted
        exclusively to the physical building lobby area. All game session matches,
        boards, tables, and physical progression events will be documented and
        photographed for sponsor valuation. Personal profiles remain protected.
      </div>

      <div className="mt-6">
        <JoinForm initialShowUpgrade={fromPaidStudy} />
      </div>

      <div className="mt-6 text-center text-xs text-gsx-muted">
        Already a member?{" "}
        <a href="/login" className="text-gsx-accent hover:underline">Sign in</a>
      </div>

      <div className="mt-auto pt-8 text-center text-[10px] uppercase tracking-wider text-gsx-muted">
        Published by JunNRyn
      </div>
    </div>
  );
}
