import Link from "next/link";

export const metadata = {
  title: "GAMESPEXS — Corporate Research Packages",
};

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const PACKAGES = [
  {
    seats: 10,
    price: 33300,
    name: "Starter Study Block",
    blurb: "One session block for up to 10 players — a full GAMESPEXS research cycle at your location or ours.",
  },
  {
    seats: 100,
    price: 333000,
    name: "Full Program",
    blurb: "Up to 100 players across multiple sessions — the complete engagement study, sponsor-ready findings included.",
  },
];

export default function PublicPackagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gsx-accent">Corporate packages</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Real player research for your organization
      </h1>
      <p className="mt-3 text-sm text-gsx-muted">
        GAMESPEXS runs structured game-research sessions with verified players, consent-first
        data handling, and findings your sponsors can trust. Two fixed packages — no hourly
        billing, no surprises.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PACKAGES.map((p) => (
          <div key={p.seats} className="rounded-xl border border-gsx-border bg-gsx-panel p-6">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold gsx-gradient-text">{usd(p.price)}</div>
              <div className="text-sm text-gsx-muted">{p.seats} players</div>
            </div>
            <div className="mt-1 text-sm font-semibold">{p.name}</div>
            <p className="mt-2 text-sm text-gsx-muted">{p.blurb}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-gsx-muted">
              <li>· {p.seats} verified player seats</li>
              <li>· Quadrant-matrix play ratings + post-game surveys</li>
              <li>· {usd(p.seats * 1000)} donated to charity — $10 per seat</li>
              <li>· Findings summary included</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gsx-border bg-gsx-panel p-6">
        <h2 className="text-sm font-semibold">How money moves — automatically</h2>
        <p className="mt-2 text-sm text-gsx-muted">
          Every package dollar is split the moment a sale is recorded: one third to the
          participant side, one third to interviewers, one third to the platform — plus{" "}
          <span className="text-gsx-accent">$10 per seat to charity</span>. A permanent,
          auditable receipt exists for every dollar.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gsx-muted">Ready to book? Contact the GAMESPEXS team — packages are invoiced directly.</span>
        <Link href="/join" className="text-gsx-accent hover:underline">
          Or join as a player →
        </Link>
      </div>
    </div>
  );
}
