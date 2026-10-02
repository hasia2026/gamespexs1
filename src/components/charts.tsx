// Dependency-free brand-styled SVG charts (server-renderable).

export function DistributionChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return <p className="text-xs text-gsx-muted">No responses yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = Math.round((d.count / total) * 100);
        const w = max > 0 ? (d.count / max) * 100 : 0;
        return (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-32 shrink-0 truncate text-gsx-muted" title={d.label}>
              {d.label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-sm bg-gsx-panel-2">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${w}%`,
                  background: "linear-gradient(90deg, #5aa9e6, #13294b)",
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums text-gsx-text">
              {d.count} <span className="text-gsx-muted">({pct}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MetricGauge({
  label,
  value,
  unit,
  min,
  max,
  cohortAvg,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  unit: string | null;
  min: number;
  max: number;
  cohortAvg?: number;
  format?: (v: number) => string;
}) {
  const span = max - min || 1;
  const clamp = (v: number) => Math.max(0, Math.min(1, (v - min) / span));
  const pos = clamp(value);
  const avgPos = cohortAvg !== undefined ? clamp(cohortAvg) : null;

  return (
    <div className="rounded border border-gsx-border bg-gsx-panel-2 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-gsx-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {format(value)}
          {unit && <span className="ml-1 text-[10px] font-normal text-gsx-muted">{unit}</span>}
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-gsx-bg">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pos * 100}%`,
            background: "linear-gradient(90deg, #5aa9e6, #ff552e 70%, #d9a441)",
          }}
        />
        {avgPos !== null && (
          <div
            className="absolute top-[-2px] h-[14px] w-[2px] bg-gsx-gold"
            style={{ left: `${avgPos * 100}%` }}
            title={`Cohort average`}
          />
        )}
      </div>
      {avgPos !== null && (
        <div className="mt-1 text-[10px] text-gsx-muted">
          ▲ gold mark = cohort average ({format(cohortAvg!)})
        </div>
      )}
    </div>
  );
}

export function Sparkline({
  values,
  width = 120,
  height = 28,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 4) + 2;
      const y = height - 3 - ((v - min) / span) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="#5aa9e6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
