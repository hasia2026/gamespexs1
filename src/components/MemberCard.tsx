"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shareable member identity card (addendum Q2/Q3 public identity):
 * the member's last initial in their signature colors, permanent Player
 * Number, and the house motto — drawn on a canvas so it downloads as a PNG.
 * The card is the only place a member's own identity is un-masked; the
 * public leaderboard still ships initials only.
 */

const CARD_W = 640;
const CARD_H = 400;
const SCALE = 2; // export at 1280×800 for socials

export const MOTTO = "In games you get another life, in life you get another game!!!!!";

const SANS = 'system-ui, "Segoe UI", Arial, sans-serif';
const MONO = 'Consolas, "Courier New", ui-monospace, monospace';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  canvas: HTMLCanvasElement,
  opts: { initial: string; playerNumber: number; tier: string; color1: string; color2: string },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

  // Navy field — the card is brand navy regardless of site theme.
  ctx.fillStyle = "#13294b";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Brand stripe: Bears orange → jade stripe → navy (same stops as gsx-brand-gradient).
  const stripe = ctx.createLinearGradient(0, 0, CARD_W, 0);
  stripe.addColorStop(0, "#ff552e");
  stripe.addColorStop(0.36, "#ff552e");
  stripe.addColorStop(0.46, "#45e0a6");
  stripe.addColorStop(0.54, "#45e0a6");
  stripe.addColorStop(0.64, "#13294b");
  stripe.addColorStop(1, "#13294b");
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, CARD_W, 12);

  // Wordmark + tagline.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${SANS}`;
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "5px";
  } catch {
    /* older engines ignore letter spacing */
  }
  ctx.fillText("GAMESPEXS", 40, 62);
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  } catch {
    /* noop */
  }
  ctx.fillStyle = "#8fa3bd";
  ctx.font = `600 10px ${SANS}`;
  ctx.fillText("GAME RESEARCH & OPERATIONS", 41, 82);

  // Tier badge.
  ctx.textAlign = "right";
  ctx.fillStyle = "#d9a441";
  ctx.font = `700 12px ${SANS}`;
  ctx.fillText(`${opts.tier.toUpperCase()} MEMBER`, CARD_W - 40, 58);
  ctx.fillStyle = "#5b6b82";
  ctx.font = `600 10px ${SANS}`;
  ctx.fillText("PLAYER CARD", CARD_W - 40, 78);

  // Divider.
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 102);
  ctx.lineTo(CARD_W - 40, 102);
  ctx.stroke();

  // Signature identity: the last initial, twice, in the member's locked pair.
  const initial = opts.initial.toUpperCase();
  drawCircle(ctx, 148, 208, 66, opts.color1);
  drawCircle(ctx, 238, 208, 66, opts.color2, 0.88);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#0f1210";
  ctx.font = `700 58px ${SANS}`;
  ctx.fillText(initial, 148, 213);
  ctx.fillText(initial, 238, 213);

  // Player Number block.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#8fa3bd";
  ctx.font = `600 11px ${SANS}`;
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "2px";
  } catch {
    /* noop */
  }
  ctx.fillText("PLAYER NUMBER", 336, 172);
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  } catch {
    /* noop */
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 56px ${MONO}`;
  ctx.fillText(`#${opts.playerNumber}`, 333, 228);
  ctx.fillStyle = "#d9a441";
  ctx.fillRect(336, 246, 64, 3);

  // Closing line: the house motto.
  ctx.fillStyle = "#d9a441";
  ctx.font = `italic 17px ${SANS}`;
  const lines = wrapText(ctx, MOTTO, CARD_W - 80);
  let y = CARD_H - 30 - (lines.length - 1) * 22;
  for (const line of lines) {
    ctx.fillText(line, 40, y);
    y += 22;
  }
}

export default function ShareCardButton({
  lastInitial,
  playerNumber,
  tier,
  color1,
  color2,
}: {
  lastInitial: string;
  playerNumber: number;
  tier: string;
  color1: string;
  color2: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas, { initial: lastInitial, playerNumber, tier, color1, color2 });
  }, [open, lastInitial, playerNumber, tier, color1, color2]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gamespexs-player-${playerNumber}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [playerNumber]);

  const copyText = useCallback(async () => {
    const text = `My GAMESPEXS identity: ${lastInitial.toUpperCase()} · Player #${playerNumber}\n"${MOTTO}"`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the PNG is the primary share path */
    }
  }, [lastInitial, playerNumber]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded border border-gsx-accent/50 px-4 py-2 text-xs font-semibold text-gsx-accent transition-colors hover:bg-gsx-accent/10"
      >
        🪪 Share my member card
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Your shareable member card"
        >
          <div
            className="w-full max-w-xl rounded-xl border border-gsx-border bg-gsx-panel p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your member card</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-gsx-muted transition-colors hover:text-gsx-text"
              >
                Close ✕
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={CARD_W * SCALE}
              height={CARD_H * SCALE}
              className="mt-3 h-auto w-full rounded-lg border border-gsx-border"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={download}
                className="rounded gsx-brand-gradient px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={copyText}
                className="rounded border border-gsx-border px-4 py-2.5 text-sm transition-colors hover:border-gsx-accent/60"
              >
                {copied ? "Copied ✓" : "Copy share text"}
              </button>
            </div>
            <p className="mt-3 text-xs text-gsx-muted">
              1280×800 — ready for socials. Your last initial, colors, and Player Number are your
              public identity; first names never leave your account.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
