import { Card, PageHeader } from "@/components/ui";
import { DEMO_MODE } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin & System Settings"
        sub="Platform configuration, connection status, and operational guardrails."
      />

      <Card>
        <h2 className="font-semibold">Database Connection</h2>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${DEMO_MODE ? "bg-gsx-warn" : "bg-gsx-accent"}`} />
            {DEMO_MODE ? (
              <span>
                <strong>Demo mode</strong> — using in-repo seed data.
              </span>
            ) : (
              <span>
                <strong>Connected</strong> — reading live data from Supabase.
              </span>
            )}
          </div>
          {DEMO_MODE && (
            <div className="rounded border border-gsx-border bg-gsx-panel-2 p-4 font-mono text-xs leading-relaxed">
              <p className="text-gsx-muted"># 1. Create a project at supabase.com, then:</p>
              <p className="mt-1 text-gsx-text">cp .env.example .env.local</p>
              <p className="text-gsx-text">
                # paste your project URL + anon key into .env.local
              </p>
              <p className="mt-2 text-gsx-muted"># 2. Run the schema in the Supabase SQL editor:</p>
              <p className="text-gsx-text">supabase/migrations/0001_gamespexs_core.sql</p>
              <p className="text-gsx-text">supabase/migrations/0002_seed.sql</p>
              <p className="mt-2 text-gsx-muted"># 3. Restart the dev server.</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Blueprint Guardrails (enforced in the database)</h2>
        <ul className="mt-3 space-y-2 text-sm text-gsx-muted">
          <li className="flex gap-2"><span className="text-gsx-accent">✓</span> Surveys capped at 15 questions (DB trigger)</li>
          <li className="flex gap-2"><span className="text-gsx-accent">✓</span> Survey duration constrained to 10–12 minutes (CHECK constraint)</li>
          <li className="flex gap-2"><span className="text-gsx-accent">✓</span> Full audit trail on every core table (trigger-based)</li>
          <li className="flex gap-2"><span className="text-gsx-accent">✓</span> Row Level Security enabled on all tables</li>
          <li className="flex gap-2"><span className="text-gsx-accent">✓</span> Participant consent tracking with timestamps</li>
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Roadmap</h2>
        <div className="mt-3 grid gap-2 text-sm text-gsx-muted sm:grid-cols-2">
          <div>Phase 3 — Field Operations</div>
          <div>Phase 4 — Sponsors</div>
          <div>Phase 5 — Analytics & Content</div>
          <div>Phase 6 — Institutional</div>
          <div>Phase 7 — Storefront & Physical Ecosystem</div>
        </div>
      </Card>
    </div>
  );
}
