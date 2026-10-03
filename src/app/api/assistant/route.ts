/**
 * GAMESPEXS platform assistant — a small, scoped AI helper for members,
 * staff, and sponsors. The Anthropic key stays server-side; the browser
 * only ever talks to this route.
 *
 * Configure with ANTHROPIC_API_KEY (never a NEXT_PUBLIC_ variable).
 * Without a key the route degrades to a friendly fallback so the widget
 * always responds.
 */

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the GAMESPEXS Platform Assistant, a concise, friendly helper embedded in the GAMESPEXS game research & operations platform.

What you know:
- Members join at /join ($2.25 standard, the $110 premium bundle of which exactly $10 goes to charity, or both fees together at $112.25 — the choice is deliberately left open). Every member gets a permanent Player Number starting at #1001, a free-look tour with no countdown (they lock whenever they choose), and locks their bubble by picking two signature colors and signing. Their public identity is always [Last Initial] + [Colors] — first names are never shown publicly. Members can download a shareable identity card from the member page. The quadrant matrix at /member/play is a 2x2 game catalog with 1-5 star ratings and 14-day per-quadrant lockouts.
- Staff sign in at /login and land on the Command Center with the full sidebar (Game Library, Research Engine, Field Operations, Sponsors, People, Admin). Sponsors land on a read-only portal at /portal.
- Founding membership is capped at the first 1,000 Player Numbers, shown live on the member dashboard leaderboard.

Page map (give mini-tours when asked, e.g. "where do I rate games?" or "show me around the research engine"):
- Member: /join (signup, $2.25 or $110), /member (identity card, signature colors, shareable card, founding leaderboard, shout ticker, lock flow), /member/play (2x2 quadrant matrix, star ratings, 14-day lockouts).
- Public kiosks: /checkin/[eventId] (QR walk-up check-in), /research/sessions/[id]/run (survey runner).
- Staff: / (Command Center KPIs), /operations (channel & location summary), /games + /games/categories + /games/mechanics (catalog & taxonomy), /research (studies, participants, sessions w/ gaze heatmap, surveys w/ distribution charts, mechanic insights, data quality, findings & reports, integrity), /field (fleet, routes, events, teams, equipment tabs + per-event command center + QR poster), /sponsors + /sponsors/report, /community, /institutional, /content, /people, /admin + /admin/audit (every write is logged), /admin/payouts (the payouts ledger: ⅓-⅓-⅓ study splits, judge percentages, street-team commissions), /storefront (Phase 7 stub).
- Sponsor: /portal (own mentions, activations, engagement-per-dollar — read-only).
- The platform guide lives in docs/PLATFORM_GUIDE.md; every question you answer is a mini version of it.

Rules:
- Answer questions about using the platform, member identity rules, pricing, and where to find features. Keep answers under ~120 words.
- You cannot access accounts, databases, payments, or personal data. Never claim to. For account or billing problems, tell the user to contact staff.
- Do not give legal, age-verification, or compliance advice — suggest contacting the GAMESPEXS team.
- If asked something unrelated to GAMESPEXS, gently steer back to platform help.
- Sign off longer answers with the house motto: "In games you get another life, in life you get another game!!!!!"`;

// ---------------------------------------------------------------------------
// Offline brain — pattern-matched answers that work with zero external calls,
// so the widget is genuinely useful before (or without) ANTHROPIC_API_KEY.
// Order matters: specific topics first, the generic tour last.
// ---------------------------------------------------------------------------
const KB: Array<{ test: RegExp; reply: string }> = [
  {
    test: /(api|anthropic|claude|brain|connect|offline)/i,
    reply:
      "I'm running in offline mode right now — my full brain switches on when an admin adds the ANTHROPIC_API_KEY environment variable in Vercel (Settings → Environment Variables, then redeploy). But I already know the essentials: joining, Player Numbers, signature colors, ratings, lockouts, sponsors, and payouts. Try the suggestion chips below.",
  },
  {
    test: /(join|sign ?up|price|cost|fee|how much|\$2|\b110\b|premium|standard|charity)/i,
    reply:
      "Joining happens at /join: Standard is a one-time $2.25 activation fee; the Premium bundle is $110, of which exactly $10 goes to the children's charity ledger; and there's a third option to pay both fees together ($112.25) — the choice is yours. After joining you get a permanent Player Number and pick two signature colors to lock your bubble.",
  },
  {
    test: /(player ?number|#?1001|numbering|username|handle)/i,
    reply:
      "Player Numbers are permanent and sequential, starting at #1001 — custom usernames and handles are banned to keep the community healthy. The first 1,000 numbers are Founding Members, tracked live on the member dashboard leaderboard.",
  },
  {
    test: /(rate|rating|star|quadrant|catalog|lockout|matrix)/i,
    reply:
      "Game ratings live at /member/play — the quadrant matrix. Every game gets a 1–5 star rating; 4–5 stars unlock deeper tracking for that genre, and 1–2 stars trigger the 14-day genre lockout so the research data stays unbiased.",
  },
  {
    test: /(color|signature|identity|initial|bubble|lock|consent)/i,
    reply:
      "Your identity is two signature colors + your last initial — never a typed username. On /member you pick from randomized two-color pools, preview your pair, then sign the Explicit Survey Consent to lock your bubble permanently. Afterwards you can download your shareable member card right from the dashboard.",
  },
  {
    test: /(password|log ?in|sign ?in|forgot|reset|account)/i,
    reply:
      "Sign in at /login. Forgot your password? Use the “Forgot password?” link there — a branded reset email arrives with a link to set a new one. Still stuck? Contact GAMESPEXS staff.",
  },
  {
    test: /(sponsor|portal|ticker|shout|ad|merch)/i,
    reply:
      "Sponsors get a read-only portal at /portal with their mentions, activations, and engagement-per-dollar. Members see sponsor shoutouts in the ticker on the member dashboard. B2B storefront spots start at $1/day.",
  },
  {
    test: /(payout|ledger|split|commission|payroll|judge|street team|paid)/i,
    reply:
      "Payouts are staff-only. The ledger automates the blueprint's fixed splits: studies divide one-third participant / one-third interviewer / one-third platform; judges earn a percentage of sessions they oversee; street-team commissions are 50¢/card, 75¢/click, and $1 plus commission per sale. Staff find it under Admin → Payouts Ledger.",
  },
  {
    test: /(motto|quote|saying)/i,
    reply: "“In games you get another life, in life you get another game!!!!!”",
  },
  {
    test: /(tour|show me|around|where|what can i|help|how (do|does)|start|guide)/i,
    reply:
      "Quick tour: members live at /member — identity card, founding leaderboard, sponsor ticker — and rate games at /member/play. Staff sign in to the Command Center with the full sidebar: Game Library, Research Engine, Field Operations, Sponsors, People, Admin. Sponsors land at /portal.",
  },
];

function answerLocally(question: string, page: string): string {
  const hit = KB.find((entry) => entry.test.test(question));
  if (hit) return hit.reply;
  const ctx = page && page !== "/" ? ` You're on ${page} right now — every page also has staff tooling one level up.` : "";
  return (
    "I'm in offline mode, so I know the essentials best: joining, Player Numbers, signature colors, ratings and lockouts, sponsors, and payouts." +
    ctx +
    " Try one of the suggestion chips, or ask staff for anything deeper."
  );
}

interface IncomingMessage {
  role?: unknown;
  content?: unknown;
}

export async function POST(req: Request) {
  let body: { messages?: IncomingMessage[]; page?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!Array.isArray(body?.messages)) {
    return Response.json({ reply: "Ask me anything about GAMESPEXS." });
  }

  // Context-awareness: the widget tells us which page the user is on, so
  // "what does this mean?" answers for the exact screen.
  const page =
    typeof body!.page === "string" && body!.page.startsWith("/")
      ? body!.page.slice(0, 200)
      : "";
  const systemPrompt = page
    ? `${SYSTEM_PROMPT}\n\nThe user is currently viewing the page: ${page} (path may include an id segment). Ground your answer in that page when relevant.`
    : SYSTEM_PROMPT;

  // Keep the conversation small and sanitize every turn.
  const history = body!.messages
    .slice(-8)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 2000),
    }))
    .filter((m) => m.content.trim().length > 0);
  while (history.length > 0 && history[0].role !== "user") history.shift();

  if (history.length === 0) {
    return Response.json({ reply: "Ask me anything about GAMESPEXS." });
  }

  if (!apiKey) {
    // Offline brain: answer from the built-in knowledge base.
    const question = history[history.length - 1]?.content ?? "";
    return Response.json({ reply: answerLocally(question, page) });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: history,
      }),
    });
    if (!res.ok) {
      return Response.json({
        reply: "I hit a snag reaching my brain service — try again in a moment.",
      });
    }
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const reply =
      data.content?.map((block) => block.text ?? "").join("").trim() ||
      "…try asking that again?";
    return Response.json({ reply });
  } catch {
    return Response.json({
      reply: "Connection hiccup on my side — try again in a moment.",
    });
  }
}
