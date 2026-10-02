import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-gsx-border bg-gsx-panel p-5 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="text-xs font-medium uppercase tracking-wider text-gsx-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-gsx-text">{value}</div>
      {sub && <div className="mt-1 text-xs text-gsx-muted">{sub}</div>}
    </Card>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-gsx-accent/15 text-gsx-accent border-gsx-accent/30",
  blue: "bg-gsx-accent-2/15 text-gsx-accent-2 border-gsx-accent-2/30",
  amber: "bg-gsx-warn/15 text-gsx-warn border-gsx-warn/30",
  red: "bg-gsx-danger/15 text-gsx-danger border-gsx-danger/30",
  gray: "bg-gsx-panel-2 text-gsx-muted border-gsx-border",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeTones | string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${badgeTones[tone] ?? badgeTones.gray}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  switch (status) {
    case "active": case "complete": case "published": case "confirmed": return "green";
    case "draft": case "scheduled": case "review": case "preliminary": return "blue";
    case "paused": case "in_progress": case "supported": return "amber";
    case "archived": case "void": case "retired": return "red";
    default: return "gray";
  }
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {sub && <p className="mt-1 text-sm text-gsx-muted">{sub}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="gsx-rule mt-4" />
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gsx-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gsx-border bg-gsx-panel-2 text-left">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gsx-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gsx-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className}`}>{children ?? <span className="text-gsx-muted">—</span>}</td>;
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gsx-border bg-gsx-panel/50 p-10 text-center">
      <p className="font-medium text-gsx-text">{title}</p>
      {sub && <p className="mt-1 text-sm text-gsx-muted">{sub}</p>}
    </div>
  );
}
