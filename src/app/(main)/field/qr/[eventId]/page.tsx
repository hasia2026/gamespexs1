import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getEvents } from "@/lib/data";
import { PageHeader, Card } from "@/components/ui";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function EventQrPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const events = await getEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const checkinUrl = `${proto}://${host}/checkin/${event.id}`;

  const dataUrl = await QRCode.toDataURL(checkinUrl, {
    width: 640,
    margin: 2,
    color: { dark: "#0f1210", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/field?tab=events" className="text-sm text-gsx-accent hover:underline">
          ← Back to events
        </Link>
        <PrintButton />
      </div>

      <PageHeader
        title="Event Check-in QR"
        sub="Print and post at the door. Attendees scan with any phone camera."
      />

      <Card className="text-center">
        <div className="font-mono text-xs text-gsx-accent-2">{event.code}</div>
        <h2 className="mt-1 text-xl font-bold">{event.title}</h2>
        <p className="mt-1 text-sm text-gsx-muted">
          {new Date(event.starts_at).toLocaleDateString(undefined, {
            weekday: "long", month: "long", day: "numeric",
          })}{" "}
          · {event.location?.name ?? "—"}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`Check-in QR code for ${event.title}`} className="mx-auto mt-6 w-72 rounded-lg" />
        <p className="mt-6 text-sm font-medium">Scan to check in</p>
        <p className="mt-1 break-all text-xs text-gsx-muted">{checkinUrl}</p>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold">How it works</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gsx-muted">
          <li>Attendee scans the QR code with their phone.</li>
          <li>They enter their participant code (or self-register on the spot).</li>
          <li>The check-in is written to <span className="font-mono text-xs">event_checkins</span> and appears in Field Operations instantly.</li>
        </ol>
      </Card>
    </div>
  );
}
