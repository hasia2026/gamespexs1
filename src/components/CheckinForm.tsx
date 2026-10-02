"use client";

import { useActionState, useState, type ReactNode } from "react";
import { checkInParticipant, logBrandMention, type ActionState } from "@/app/actions";
import { FormResult, SubmitButton } from "./CrudForm";

export function CheckinForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState<ActionState | null, FormData>(checkInParticipant, null);
  return (
    <form action={action} className="w-full max-w-md space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="method" value="qr" />
      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">
          Participant code
        </span>
        <input
          name="code"
          required
          autoFocus
          placeholder="P-0001"
          className="mt-2 w-full rounded-xl border border-gsx-border bg-gsx-panel px-4 py-4 text-center font-mono text-2xl uppercase tracking-widest outline-none focus:border-gsx-accent/60"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-xl gsx-brand-gradient px-4 py-4 text-lg font-bold transition-opacity hover:opacity-90"
      >
        Check In
      </button>
      <FormResult state={state} />
    </form>
  );
}

export function MentionLogger({
  sponsors,
  eventId,
}: {
  sponsors: Array<{ id: string; name: string }>;
  eventId?: string;
}) {
  const [state, action] = useActionState<ActionState | null, FormData>(logBrandMention, null);
  return (
    <CollapsibleMention action={action}>
      <div className="space-y-3">
        {eventId ? (
          <>
            <input type="hidden" name="context_ref" value={eventId} />
            <input type="hidden" name="source" value="event_announcement" />
          </>
        ) : (
          <input type="hidden" name="source" value="manual" />
        )}
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">Sponsor</span>
          <select
            name="sponsor_id"
            required
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
          >
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        {!eventId && (
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">
              Context (event / session id)
            </span>
            <input
              name="context_ref"
              placeholder="evt-2 or sess-014"
              className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">What was said</span>
          <textarea
            name="phrase"
            required
            rows={2}
            placeholder="Prize table sponsored by …"
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
          />
        </label>
        <div className="flex items-center gap-3">
          <SubmitButton label="Tally Mention" />
          <FormResult state={state} />
        </div>
      </div>
    </CollapsibleMention>
  );
}

function CollapsibleMention({
  action,
  children,
}: {
  action: (fd: FormData) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-gsx-border bg-gsx-panel px-3 py-1.5 text-sm text-gsx-accent hover:border-gsx-accent/40"
      >
        {open ? "× Close" : "+ Tally a verbal mention"}
      </button>
      {open && (
        <form action={action} className="mt-3 rounded-lg border border-gsx-border bg-gsx-panel p-4">
          {children}
        </form>
      )}
    </div>
  );
}
