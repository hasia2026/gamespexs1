"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded gsx-brand-gradient px-3 py-1.5 text-xs font-semibold hover:opacity-90"
    >
      🖨 Print / Save PDF
    </button>
  );
}
