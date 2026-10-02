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
- Members join at /join ($2.25 standard or the $110 premium bundle, of which exactly $10 goes to charity). Every member gets a permanent Player Number starting at #1001, a 72-hour free-look tour, and locks their bubble by picking two signature colors and signing. Their public identity is always [Last Initial] + [Colors] — first names are never shown publicly. Members can download a shareable identity card from the member page. The quadrant matrix at /member/play is a 2x2 game catalog with 1-5 star ratings and 14-day per-quadrant lockouts.
- Staff sign in at /login and land on the Command Center with the full sidebar (Game Library, Research Engine, Field Operations, Sponsors, People, Admin). Sponsors land on a read-only portal at /portal.
- Founding membership is capped at the first 1,000 Player Numbers, shown live on the member dashboard leaderboard.

Page map (give mini-tours when asked, e.g. "where do I rate games?" or "show me around the research engine"):
- Member: /join (signup, $2.25 or $110), /member (identity card, signature colors, shareable card, founding leaderboard, shout ticker, lock flow), /member/play (2x2 quadrant matrix, star ratings, 14-day lockouts).
- Public kiosks: /checkin/[eventId] (QR walk-up check-in), /research/sessions/[id]/run (survey runner).
- Staff: / (Command Center KPIs), /operations (channel & location summary), /games + /games/categories + /games/mechanics (catalog & taxonomy), /research (studies, participants, sessions w/ gaze heatmap, surveys w/ distribution charts, mechanic insights, data quality, findings & reports, integrity), /field (fleet, routes, events, teams, equipment tabs + per-event command center + QR poster), /sponsors + /sponsors/report, /community, /institutional, /content, /people, /admin + /admin/audit (every write is logged), /storefront (Phase 7 stub).
- Sponsor: /portal (own mentions, activations, engagement-per-dollar — read-only).
- The platform guide lives in docs/PLATFORM_GUIDE.md; every question you answer is a mini version of it.

Rules:
- Answer questions about using the platform, member identity rules, pricing, and where to find features. Keep answers under ~120 words.
- You cannot access accounts, databases, payments, or personal data. Never claim to. For account or billing problems, tell the user to contact staff.
- Do not give legal, age-verification, or compliance advice — suggest contacting the GAMESPEXS team.
- If asked something unrelated to GAMESPEXS, gently steer back to platform help.
- Sign off longer answers with the house motto: "In games you get another life, in life you get another game!!!!!"`;

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
    return Response.json({
      reply:
        "I'm not connected to my brain yet — an admin needs to add the ANTHROPIC_API_KEY environment variable (get one at console.anthropic.com). Until then, try the links at the top of the page or ask staff.",
    });
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
