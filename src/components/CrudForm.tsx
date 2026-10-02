"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

export function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
      />
    </label>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#5aa9e6]"
      />
      {label}
    </label>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function CollapsibleForm({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-gsx-border bg-gsx-panel px-3 py-1.5 text-sm text-gsx-accent hover:border-gsx-accent/40"
      >
        {open ? "× Close" : `+ ${title}`}
      </button>
      {open && <div className="mt-3 rounded-lg border border-gsx-border bg-gsx-panel p-4">{children}</div>}
    </div>
  );
}

export function FormResult({ state }: { state: ActionState | null }) {
  if (!state) return null;
  return (
    <p className={`text-xs ${state.ok ? "text-gsx-accent" : "text-gsx-danger"}`}>
      {state.message}
    </p>
  );
}
