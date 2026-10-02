"use client";

import { useActionState } from "react";
import {
  createContent, createGame, createParticipant, createSession, createStudy,
  type ActionState,
} from "@/app/actions";
import {
  CheckField, CollapsibleForm, Field, FormResult, SelectField,
  SubmitButton, TextareaField,
} from "./CrudForm";
import type { GameCategory, Participant, Study } from "@/lib/types";

export function NewContentForm({
  people,
  games,
  studies,
}: {
  people: Array<{ id: string; full_name: string }>;
  games: Array<{ id: string; title: string }>;
  studies: Array<{ id: string; code: string }>;
}) {
  const [state, action] = useActionState<ActionState | null, FormData>(createContent, null);
  return (
    <CollapsibleForm title="New Content Item">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" required />
          <SelectField
            label="Type"
            name="content_type"
            defaultValue="article"
            options={[
              { value: "article", label: "Article" },
              { value: "video", label: "Video" },
              { value: "photo", label: "Photo" },
              { value: "game_guide", label: "Game Guide" },
              { value: "press", label: "Press" },
              { value: "other", label: "Other" },
            ]}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue="draft"
            options={[
              { value: "draft", label: "Draft" },
              { value: "review", label: "In review" },
              { value: "published", label: "Published" },
            ]}
          />
          <SelectField
            label="Author"
            name="author_person_id"
            defaultValue=""
            options={[{ value: "", label: "— none —" }, ...people.map((p) => ({ value: p.id, label: p.full_name }))]}
          />
          <SelectField
            label="Linked Game"
            name="game_id"
            defaultValue=""
            options={[{ value: "", label: "— none —" }, ...games.map((g) => ({ value: g.id, label: g.title }))]}
          />
          <SelectField
            label="Linked Study"
            name="study_id"
            defaultValue=""
            options={[{ value: "", label: "— none —" }, ...studies.map((s) => ({ value: s.id, label: s.code }))]}
          />
        </div>
        <Field label="Media URL (video/photo)" name="media_url" placeholder="https://…" />
        <TextareaField label="Body (markdown)" name="body_md" rows={6} />
        <div className="flex items-center gap-3">
          <SubmitButton label="Add to Library" />
          <FormResult state={state} />
        </div>
      </form>
    </CollapsibleForm>
  );
}

function CategoryOptions(categories: GameCategory[]) {
  return categories.map((c) => ({ value: c.id, label: c.name }));
}

export function NewGameForm({ categories }: { categories: GameCategory[] }) {
  const [state, action] = useActionState<ActionState | null, FormData>(createGame, null);
  return (
    <CollapsibleForm title="New Game">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" required />
          <SelectField label="Category" name="category_id" options={CategoryOptions(categories)} required />
          <Field label="Publisher" name="publisher" />
          <Field label="Year Released" name="year_released" type="number" min={1950} max={2100} />
          <Field label="Min Players" name="min_players" type="number" min={1} defaultValue={1} />
          <Field label="Max Players" name="max_players" type="number" min={1} defaultValue={4} />
          <Field label="Play Minutes" name="play_minutes" type="number" min={1} />
          <SelectField
            label="Complexity"
            name="complexity"
            defaultValue="medium"
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </div>
        <CheckField label="Closed-network title (institutional deployment)" name="is_closed_network" />
        <TextareaField label="Description" name="description" />
        <div className="flex items-center gap-3">
          <SubmitButton label="Create Game" />
          <FormResult state={state} />
        </div>
      </form>
    </CollapsibleForm>
  );
}

export function NewStudyForm() {
  const [state, action] = useActionState<ActionState | null, FormData>(createStudy, null);
  return (
    <CollapsibleForm title="New Study">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" required />
          <Field label="Code (auto if blank)" name="code" placeholder="GSX-2026-004" />
          <Field label="Starts On" name="starts_on" type="date" />
          <Field label="Ends On" name="ends_on" type="date" />
          <SelectField
            label="Status"
            name="status"
            defaultValue="draft"
            options={[
              { value: "draft", label: "Draft" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
            ]}
          />
        </div>
        <TextareaField label="Research Question" name="research_question" />
        <div className="flex items-center gap-3">
          <SubmitButton label="Create Study" />
          <FormResult state={state} />
        </div>
      </form>
    </CollapsibleForm>
  );
}

export function NewParticipantForm() {
  const [state, action] = useActionState<ActionState | null, FormData>(createParticipant, null);
  return (
    <CollapsibleForm title="New Participant">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" name="code" required placeholder="P-0015" />
          <Field label="Display Name" name="display_name" />
          <Field label="Birth Year" name="birth_year" type="number" min={1920} max={2020} />
          <Field label="Gender" name="gender" />
          <Field label="City" name="city" />
          <Field label="County" name="county" />
        </div>
        <CheckField label="Consent obtained (records timestamp)" name="consent_given" />
        <div className="flex items-center gap-3">
          <SubmitButton label="Create Participant" />
          <FormResult state={state} />
        </div>
      </form>
    </CollapsibleForm>
  );
}

export function NewSessionForm({
  studies,
  participants,
  games,
  locations,
}: {
  studies: Study[];
  participants: Participant[];
  games: Array<{ id: string; title: string }>;
  locations: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState<ActionState | null, FormData>(createSession, null);
  return (
    <CollapsibleForm title="Schedule Session">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Study"
            name="study_id"
            required
            options={studies.map((s) => ({ value: s.id, label: `${s.code} — ${s.title}` }))}
          />
          <SelectField
            label="Participant"
            name="participant_id"
            required
            options={participants.map((p) => ({ value: p.id, label: `${p.code}${p.display_name ? ` — ${p.display_name}` : ""}` }))}
          />
          <SelectField
            label="Game"
            name="game_id"
            required
            options={games.map((g) => ({ value: g.id, label: g.title }))}
          />
          <SelectField
            label="Location"
            name="location_id"
            options={[{ value: "", label: "— none —" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]}
          />
          <SelectField
            label="Channel"
            name="channel"
            defaultValue="storefront"
            options={[
              { value: "storefront", label: "Storefront" },
              { value: "mobile_unit", label: "Mobile Unit" },
              { value: "event", label: "Event" },
              { value: "institutional", label: "Institutional" },
              { value: "remote", label: "Remote" },
            ]}
          />
          <Field label="Duration (minutes)" name="duration_minutes" type="number" min={1} max={480} />
        </div>
        <TextareaField label="Notes" name="notes" rows={2} />
        <div className="flex items-center gap-3">
          <SubmitButton label="Schedule Session" />
          <FormResult state={state} />
        </div>
      </form>
    </CollapsibleForm>
  );
}
