import { notFound } from "next/navigation";
import { getEventById } from "@/lib/data";
import { CheckinForm } from "@/components/CheckinForm";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  return (
    <div className="flex w-full max-w-lg flex-1 flex-col items-center text-center">
      <div className="gsx-gradient-text text-3xl font-bold tracking-wide">GAMESPEXS</div>
      <h1 className="mt-6 text-2xl font-bold">Check In</h1>
      <p className="mt-1 text-sm text-gsx-muted">
        {event.title} · {new Date(event.starts_at).toLocaleDateString()}
      </p>
      <div className="mt-8 w-full">
        <CheckinForm eventId={event.id} />
      </div>
      <p className="mt-6 text-xs text-gsx-muted">
        Don&apos;t have a code? Enter any word you&apos;ll remember — we&apos;ll register you on the spot.
      </p>
    </div>
  );
}
