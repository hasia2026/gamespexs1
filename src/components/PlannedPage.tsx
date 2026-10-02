import { Badge, Card, PageHeader } from "./ui";

interface Props {
  title: string;
  phase: string;
  icon: string;
  description: string;
  items: string[];
}

export default function PlannedPage({ title, phase, icon, description, items }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader title={`${title}`} sub={description} />
      <Card className="border-dashed">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gsx-border bg-gsx-panel-2 text-2xl">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="blue">{phase}</Badge>
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-gsx-muted">
          {items.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-gsx-accent">▸</span> {i}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
