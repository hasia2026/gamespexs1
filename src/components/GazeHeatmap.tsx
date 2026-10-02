import type { GazeFixation } from "@/lib/types";

/**
 * Gaze heatmap — renders normalized fixations (0-100 space) as blurred heat
 * blobs on a 16:9 "screen". Heat builds where blobs overlap. Brand colormap:
 * teal core → orange → gold fringe on the charcoal screen.
 */
export default function GazeHeatmap({
  fixations,
  title = "Gaze heatmap",
}: {
  fixations: GazeFixation[];
  title?: string;
}) {
  if (fixations.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-gsx-border bg-gsx-panel text-sm text-gsx-muted">
        No gaze data captured for this session
      </div>
    );
  }

  // 16:9 screen: map 0-100 x → 0-160, 0-100 y → 0-90.
  const X = (v: number) => (v / 100) * 160;
  const Y = (v: number) => (v / 100) * 90;
  const R = (d: number) => 5 + Math.min(9, d / 55); // duration → radius

  const totalDuration = fixations.reduce((s, f) => s + f.duration_ms, 0);

  return (
    <figure>
      <svg
        viewBox="0 0 160 90"
        className="w-full rounded-lg border border-gsx-border bg-[#0c100e]"
        role="img"
        aria-label={title}
      >
        <defs>
          <radialGradient id="gsx-heat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f08c3a" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#f5a742" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#5aa9e6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#5aa9e6" stopOpacity="0" />
          </radialGradient>
          <filter id="gsx-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <pattern id="gsx-grid" width="16" height="9" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 9" fill="none" stroke="#2a332c" strokeWidth="0.3" />
          </pattern>
        </defs>

        <rect width="160" height="90" fill="url(#gsx-grid)" />

        {/* brand target watermark */}
        <g opacity="0.14">
          <circle cx="80" cy="45" r="22" fill="none" stroke="#d9a441" strokeWidth="1.6" />
          <circle cx="80" cy="45" r="12" fill="none" stroke="#f08c3a" strokeWidth="1.6" />
          <circle cx="80" cy="45" r="4" fill="#5aa9e6" />
        </g>

        <g filter="url(#gsx-blur)">
          {fixations.map((f) => (
            <circle
              key={f.id}
              cx={X(Number(f.x))}
              cy={Y(Number(f.y))}
              r={R(Number(f.duration_ms))}
              fill="url(#gsx-heat)"
            />
          ))}
        </g>

        {/* fixation centroids for precision reading */}
        {fixations
          .filter((f) => Number(f.duration_ms) > 320)
          .map((f) => (
            <g key={`c-${f.id}`}>
              <circle
                cx={X(Number(f.x))}
                cy={Y(Number(f.y))}
                r="1.4"
                fill="#eef4ef"
                opacity="0.9"
              />
            </g>
          ))}
      </svg>
      <figcaption className="mt-2 flex items-center justify-between text-[11px] text-gsx-muted">
        <span>{title}</span>
        <span>
          {fixations.length} fixations · {(totalDuration / 1000).toFixed(1)}s total gaze ·
          white dots = &gt;320ms holds
        </span>
      </figcaption>
    </figure>
  );
}
