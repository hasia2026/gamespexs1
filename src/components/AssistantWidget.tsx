"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Floating AI assistant — bottom-right chat bubble available across the
 * platform. Talks to /api/assistant, which keeps the model key server-side.
 */

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hey! I'm the GAMESPEXS assistant. Ask me anything — joining, Player Numbers, your signature identity, the quadrant matrix, or staff tools.",
};

const SUGGESTIONS = [
  "How do I join?",
  "What's a Player Number?",
  "How do signature colors work?",
  "Where do I rate games?",
  "Show me around this page",
];

export default function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy, open]);

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // Never send the local greeting as history — the API wants user-first.
      const payload = next.filter((m, i) => !(i === 0 && m === GREETING));
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payload, page: pathname }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "…try that again?" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection hiccup — try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-gsx-border bg-gsx-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-gsx-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Platform Assistant</div>
              <div className="text-[10px] uppercase tracking-wider text-gsx-muted">
                powered by Claude
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gsx-muted transition-colors hover:text-gsx-text"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-gsx-accent/15 text-gsx-text"
                    : "bg-gsx-panel-2 text-gsx-text"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] rounded-lg bg-gsx-panel-2 px-3 py-2 text-sm text-gsx-muted">
                thinking…
              </div>
            )}
          </div>

          <div className="border-t border-gsx-border p-3">
            {messages.length <= 1 && !busy && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-gsx-border px-2.5 py-1 text-[11px] text-gsx-muted transition-colors hover:border-gsx-accent/60 hover:text-gsx-text"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about the platform…"
                className="flex-1 rounded border border-gsx-border bg-gsx-bg px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
                aria-label="Message the assistant"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="rounded gsx-brand-gradient px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full gsx-brand-gradient text-lg shadow-lg transition-transform hover:scale-105"
        aria-label={open ? "Close assistant" : "Open platform assistant"}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
