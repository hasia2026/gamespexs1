"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ShareCardButton from "./MemberCard";

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

export interface LeaderRow {
  player_number: number;
  last_initial: string;
  signature_color_1: string | null;
  tier: string;
}

export interface ShoutRow {
  sponsor_id: string;
  name: string;
  tier: string | null;
  is_prize_partner: boolean | null;
  mention_count: number;
}

// Founding-1,000 scarcity: lowest / earliest Player Numbers, total member count.
function FoundingCard({
  leaders,
  memberCount,
  capacity,
  me,
}: {
  leaders: LeaderRow[];
  memberCount: number;
  capacity: number;
  me: number | null;
}) {
  const spotsLeft = Math.max(0, capacity - memberCount);
  return (
    <section className="rounded-xl border border-gsx-border bg-gsx-panel p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gsx-muted">Founding members</h2>
        <span className="text-xs text-gsx-gold">First {capacity.toLocaleString()}, forever</span>
      </div>
      <p className="mt-2 text-sm text-gsx-muted">
        <span className="font-semibold text-gsx-text">{memberCount.toLocaleString()}</span> of {capacity.toLocaleString()}{" "}
        founding bubbles locked in — <span className="text-gsx-gold">{spotsLeft.toLocaleString()}</span> Player
        Numbers remain.
      </p>
      {leaders.length > 0 ? (
        <ol className="mt-4 space-y-1.5">
          {leaders.map((l) => (
            <li
              key={l.player_number}
              className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                l.player_number === me ? "bg-gsx-accent/10 text-gsx-accent" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <SignatureDot
                  initial={l.last_initial}
                  color={l.signature_color_1 ?? "#5aa9e6"}
                />
                <span className="font-mono">#{l.player_number}</span>
              </span>
              <span className={`text-xs capitalize ${l.tier === "premium" ? "text-gsx-gold" : "text-gsx-muted"}`}>
                {l.tier}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-gsx-muted">No founding numbers claimed yet — the earliest are still open.</p>
      )}
      {me !== null && (
        <p className="mt-3 text-xs text-gsx-muted">
          Your Player Number: <span className="font-mono text-gsx-accent-2">#{me}</span>
        </p>
      )}
    </section>
  );
}

// Sponsor shout-out ticker: reuses the brand-mention tally (staff-side shout-outs).
function ShoutTicker({ shoutouts }: { shoutouts: ShoutRow[] }) {
  if (shoutouts.length === 0) return null;
  const line = shoutouts
    .map(
      (s) =>
        `${s.is_prize_partner ? "⭐" : "🏆"} ${s.name} — ${s.mention_count} shout-out${s.mention_count === 1 ? "" : "s"}`,
    )
    .join("   •   ");
  return (
    <section className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
      <style>{`@keyframes gsx-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div className="overflow-hidden">
        <div
          className="inline-flex whitespace-nowrap text-sm text-gsx-muted"
          style={{ animation: "gsx-ticker 28s linear infinite" }}
        >
          <span className="pr-8">{line}</span>
          <span className="pr-8" aria-hidden>
            {line}
          </span>
        </div>
      </div>
    </section>
  );
}

// Signature dot preview: [Last Initial] + [Color] identity (addendum Q2 masking).
function SignatureDot({ initial, color }: { initial: string; color: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-[#0f1210]"
      style={{ background: color }}
    >
      {initial}
    </span>
  );
}

// Two separate, universally randomized color pools (blueprint L3/L4).
const POOL_A = ["#45e0a6", "#f08c3a", "#d9a441", "#5aa9e6", "#e05aa9", "#7bdff2"];
const POOL_B = ["#f25c54", "#4ecdc4", "#ffe66d", "#9b5de5", "#59cd90", "#f4a261"];

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

const pick = <T,>(pool: readonly T[]): T => pool[Math.floor(Math.random() * pool.length)];
const pickPair = (): [string, string] => [pick(POOL_A), pick(POOL_B)];
// Two distinct options from ONE pool, for the this-or-that panel.
const pickTwo = (pool: readonly string[]): [string, string] => {
  const a = pick(pool);
  let b = pick(pool);
  while (b === a) b = pick(pool);
  return [a, b];
};

// Addendum Q3, social-app style: colors arrive two at a time — pick from the
// pair, get a fresh pair, everyone lands on a slightly different shade.
const CHOICE_HINT =
  "Two colors at a time — tap the one that feels right. Your two picks become your one-of-one member identity.";

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MemberDashboard({
  initial,
  leaderboard,
  shoutouts,
}: {
  initial: MemberInfo;
  leaderboard?: { leaders: LeaderRow[]; member_count: number; founding_capacity: number };
  shoutouts?: ShoutRow[];
}) {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo>(initial);
  const [remaining, setRemaining] = useState(initial.seconds_remaining);
  const [color1, setColor1] = useState<string | null>(initial.signature_color_1);
  const [color2, setColor2] = useState<string | null>(initial.signature_color_2);
  const [signing, setSigning] = useState(false);
  // Addendum Q3: dynamic digital signature — chosen from random two-color panels.
  const [draft1, setDraft1] = useState<string>(initial.signature_color_1 ?? pickPair()[0]);
  const [draft2, setDraft2] = useState<string>(initial.signature_color_2 ?? pickPair()[1]);
  const [pair1, setPair1] = useState<[string, string]>(() => pickTwo(POOL_A));
  const [pair2, setPair2] = useState<[string, string]>(() => pickTwo(POOL_B));
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const locked = member.consent_status === "locked_bubble";

  // The 72:00:00 countdown (server seconds remaining, ticking locally).
  useEffect(() => {
    if (locked) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          // Auto-lock gateway: refresh server state at 00:00:00.
          router.refresh();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [locked, router]);

  const expired = remaining <= 0 && !locked;

  // Canvas signature pad.
  useEffect(() => {
    if (!signing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#151a17";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let last: { x: number; y: number } | null = null;

    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      last = pos(e);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = pos(e);
      ctx.strokeStyle = draft1 ?? "#5aa9e6";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last?.x ?? p.x, last?.y ?? p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      dirty.current = true;
    };
    const up = () => {
      drawing.current = false;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [signing, step, draft1]);

  async function lockBubble() {
    setBusy(true);
    setError(null);
    const canvas = canvasRef.current;
    const image = canvas && dirty.current ? canvas.toDataURL("image/png") : "";
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lock_member_bubble", {
      p_color_1: draft1,
      p_color_2: draft2,
      p_signature_image: image,
    });
    const result = (data ?? null) as { ok: boolean; player_number?: number; error?: string } | null;
    if (error || !result?.ok) {
      setError(result?.error ?? error?.message ?? "Could not lock your bubble.");
      setBusy(false);
      return;
    }
    // The pair locks permanently at final execution (addendum Q4).
    setColor1(draft1);
    setColor2(draft2);
    if (!image) {
      setDraft1(draft1);
      setDraft2(draft2);
      dirty.current = false;
    }
    setMember((m) => ({ ...m, consent_status: "locked_bubble", player_number: result.player_number ?? null }));
    setSigning(false);
    setBusy(false);
    router.refresh();
  }

  const displayName = useMemo(
    () => `${member.first_name} ${member.last_initial}.`,
    [member.first_name, member.last_initial],
  );

  return (
    <div className="w-full max-w-2xl space-y-6">
      <header className="text-center">
        <div className="gsx-gradient-text text-3xl font-bold tracking-wide">GAMESPEXS</div>
        <p className="mt-1 text-sm text-gsx-muted">
          {locked ? "Bubble locked — welcome to the field." : "72-hour free-look tour"}
        </p>
        <a
          href="/member/play"
          className="mt-2 inline-block text-xs text-gsx-accent underline"
        >
          Browse the quadrant matrix →
        </a>
      </header>

      {/* Member identity card */}
      <section className="rounded-xl border border-gsx-border bg-gsx-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gsx-muted">Member</div>
            <div className="mt-1 text-xl font-semibold">{displayName}</div>
            {member.player_number !== null && (
              <div className="mt-1 font-mono text-sm text-gsx-accent-2">
                Player #{member.player_number}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gsx-muted">Tier</div>
            <div className={`mt-1 text-sm font-semibold capitalize ${member.tier === "premium" ? "text-gsx-gold" : "text-gsx-accent"}`}>
              {member.tier} · {usd(member.paid_cents)}
            </div>
          </div>
        </div>

        {member.signature_color_1 && member.signature_color_2 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gsx-muted">Signature identity:</span>
            <SignatureDot initial={member.last_initial} color={member.signature_color_1} />
            <SignatureDot initial={member.last_initial} color={member.signature_color_2} />
            <span className="text-xs text-gsx-muted">permanent — locked at signing</span>
          </div>
        )}

        {member.signature_color_1 && member.signature_color_2 && member.player_number !== null && (
          <ShareCardButton
            lastInitial={member.last_initial}
            playerNumber={member.player_number}
            tier={member.tier}
            color1={member.signature_color_1}
            color2={member.signature_color_2}
          />
        )}
      </section>

      {leaderboard && (
        <FoundingCard
          leaders={leaderboard.leaders}
          memberCount={leaderboard.member_count}
          capacity={leaderboard.founding_capacity}
          me={member.player_number}
        />
      )}

      {shoutouts && <ShoutTicker shoutouts={shoutouts} />}

      {/* Free-look countdown / lock status */}
      {!locked && (
        <section
          className={`rounded-xl border p-6 text-center ${
            expired ? "border-gsx-danger/40 bg-gsx-danger/10" : "border-gsx-accent/30 bg-gsx-accent/5"
          }`}
        >
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Free look ends in</div>
          <div className={`mt-2 font-mono text-4xl font-bold tabular-nums ${expired ? "text-gsx-danger" : "text-gsx-accent"}`}>
            {fmt(Math.max(0, remaining))}
          </div>
          {expired ? (
            <p className="mt-3 text-sm text-gsx-danger">
              The tour is over — sign the Explicit Survey Consent below to lock your bubble.
            </p>
          ) : (
            <p className="mt-3 text-xs text-gsx-muted">
              During the tour you can browse the game catalog and sample single
              pop-up questions. Lock in early any time.
            </p>
          )}
          <button
            onClick={() => {
              setPair1(pickTwo(POOL_A));
              setPair2(pickTwo(POOL_B));
              setStep(1);
              setSigning(true);
            }}
            className="mt-4 rounded gsx-brand-gradient px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            Lock my bubble — Explicit Survey Consent
          </button>
        </section>
      )}

      {/* L4 consent flow — social this-or-that: two colors per panel, three steps */}
      {signing && !locked && (
        <section className="rounded-xl border border-gsx-border bg-gsx-panel p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Explicit Survey Consent</h2>
            <span className="text-xs text-gsx-muted">Step {step} of 3</span>
          </div>
          <p className="mt-1 text-xs text-gsx-muted">{CHOICE_HINT}</p>

          {step === 1 && (
            <>
              <p className="mt-4 text-sm font-medium">Pick your first color</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {pair1.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setDraft1(c);
                      setPair1(pickTwo(POOL_A));
                      setStep(2);
                    }}
                    className="group flex h-32 flex-col items-center justify-center gap-3 rounded-xl border-2 border-gsx-border transition-transform hover:scale-[1.02] hover:border-gsx-text"
                    style={{ background: `${c}22` }}
                    aria-label={`Choose color ${c}`}
                  >
                    <span className="h-14 w-14 rounded-full border border-gsx-border shadow-lg" style={{ background: c }} />
                    <span className="font-mono text-[10px] uppercase text-gsx-muted group-hover:text-gsx-text">pick this</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="mt-4 text-sm font-medium">Pick your second color</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {pair2.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setDraft2(c);
                      setPair2(pickTwo(POOL_B));
                      setStep(3);
                      dirty.current = false;
                    }}
                    className="group flex h-32 flex-col items-center justify-center gap-3 rounded-xl border-2 border-gsx-border transition-transform hover:scale-[1.02] hover:border-gsx-text"
                    style={{ background: `${c}22` }}
                    aria-label={`Choose color ${c}`}
                  >
                    <span className="h-14 w-14 rounded-full border border-gsx-border shadow-lg" style={{ background: c }} />
                    <span className="font-mono text-[10px] uppercase text-gsx-muted group-hover:text-gsx-text">pick this</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-gsx-muted">
                <span>First pick:</span>
                <SignatureDot initial={member.last_initial} color={draft1} />
                <button type="button" onClick={() => setStep(1)} className="text-gsx-accent hover:underline">
                  ← change
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mt-4 flex items-center gap-3">
                <SignatureDot initial={member.last_initial} color={draft1} />
                <SignatureDot initial={member.last_initial} color={draft2} />
                <span className="text-xs text-gsx-muted">
                  This pair becomes your permanent identity — {member.last_initial} in your colors, everywhere.
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={640}
                height={220}
                className="mt-4 w-full cursor-crosshair rounded-lg border border-gsx-border touch-none"
              />

              {error && <p className="mt-3 text-xs text-gsx-danger">{error}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={lockBubble}
                  disabled={busy || !draft1 || !draft2}
                  className="rounded bg-gsx-accent px-5 py-2.5 text-sm font-semibold text-[#0f1210] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? "Locking…" : "Sign & Lock Bubble"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={busy}
                  className="rounded border border-gsx-border px-4 py-2.5 text-sm text-gsx-text transition-colors hover:border-gsx-accent/60 disabled:opacity-40"
                >
                  ← change colors
                </button>
                <button
                  onClick={() => setSigning(false)}
                  className="text-sm text-gsx-muted hover:text-gsx-text"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {locked && (
        <section className="rounded-xl border border-gsx-accent/30 bg-gsx-accent/5 p-6 text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-2 text-sm italic text-gsx-gold">
            In games you get another life, in life you get another game!!!!!
          </p>
          <p className="mt-2 text-sm text-gsx-muted">
            Consent locked. Your quadrant matrix is open — go rate the catalog.
          </p>
          <a
            href="/member/play"
            className="mt-4 inline-block rounded gsx-brand-gradient px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            Open my quadrant matrix →
          </a>
        </section>
      )}
    </div>
  );
}
