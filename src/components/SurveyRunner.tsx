"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitSurveyRun, type ActionState } from "@/app/actions";
import type { Survey, SurveyQuestion } from "@/lib/types";

const SOFT_LIMIT_MIN = 10; // warn at 10 minutes (blueprint floor)
const HARD_LIMIT_MIN = 12; // auto-submit at 12 minutes (blueprint ceiling)

// The 2x2 symmetrical screen matrix (blueprint): Q1 team ball, Q2 video, Q3 board, Q4 card/odd.
const QUAD_META: Record<string, { label: string; hue: string }> = {
  q1: { label: "Q1 · Team Ball", hue: "#f08c3a" },
  q2: { label: "Q2 · Video", hue: "#45e0a6" },
  q3: { label: "Q3 · Board", hue: "#5aa9e6" },
  q4: { label: "Q4 · Card & Odd", hue: "#d9a441" },
};

function RunnerSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl gsx-brand-gradient px-8 py-4 text-lg font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? "Saving…" : "Submit Survey →"}
    </button>
  );
}

export default function SurveyRunner({
  survey,
  questions,
  sessionId,
  participantCode,
}: {
  survey: Survey;
  questions: SurveyQuestion[];
  sessionId: string;
  participantCode: string;
}) {
  const [state, action] = useActionState<ActionState | null, FormData>(submitSurveyRun, null);
  const [step, setStep] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const minutes = elapsed / 60_000;
  const overSoft = minutes >= SOFT_LIMIT_MIN;
  const overHard = minutes >= HARD_LIMIT_MIN;

  // Auto-submit at the 12-minute blueprint ceiling (form.requestSubmit).
  useEffect(() => {
    if (overHard && !autoSubmitted.current) {
      const form = document.getElementById("runner-form") as HTMLFormElement | null;
      if (form) {
        autoSubmitted.current = true;
        form.requestSubmit();
      }
    }
  }, [overHard]);

  const progress = questions.length > 0 ? ((step + (state?.ok ? 1 : 0)) / questions.length) * 100 : 0;

  const fieldId = useMemo(() => (qq: SurveyQuestion) => `q_${qq.id}`, []);

  if (state?.ok) {
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <div className="text-7xl">🎯</div>
        <h1 className="mt-6 text-3xl font-bold">Thank you!</h1>
        <p className="mt-2 text-lg text-gsx-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col">
      {/* Header: brand + timer */}
      <header className="flex items-center justify-between">
        <div className="gsx-gradient-text text-2xl font-bold tracking-wide">GAMESPEXS</div>
        <div
          className={`rounded-full border px-4 py-1.5 font-mono text-sm tabular-nums ${
            overHard
              ? "border-gsx-danger/40 bg-gsx-danger/10 text-gsx-danger"
              : overSoft
                ? "border-gsx-warn/40 bg-gsx-warn/10 text-gsx-warn"
                : "border-gsx-border text-gsx-muted"
          }`}
        >
          {String(Math.floor(minutes)).padStart(2, "0")}:
          {String(Math.floor((elapsed % 60_000) / 1000)).padStart(2, "0")} / {HARD_LIMIT_MIN}:00
        </div>
      </header>

      {overSoft && !overHard && (
        <div className="mt-4 rounded-lg border border-gsx-warn/30 bg-gsx-warn/10 p-3 text-center text-sm text-gsx-warn">
          You&apos;re past the {SOFT_LIMIT_MIN}-minute mark — a few minutes left to finish comfortably.
        </div>
      )}
      {overHard && (
        <div className="mt-4 rounded-lg border border-gsx-danger/30 bg-gsx-danger/10 p-3 text-center text-sm text-gsx-danger">
          Time is up — submitting what you&apos;ve answered so far.
        </div>
      )}

      {/* Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gsx-muted">
          <span>Question {Math.min(step + 1, questions.length)} of {questions.length}</span>
          <span>{survey.title}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gsx-panel-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #5aa9e6, #13294b)",
            }}          />
        </div>        </div>

      {/* Quadrant matrix: which slice of the catalog this question speaks for */}
      {questions.some((qq) => qq.quadrant) && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {(["q1", "q2", "q3", "q4"] as const).map((code) => {
            const active = questions[step]?.quadrant === code;
            const meta = QUAD_META[code];
            return (
              <div
                key={code}
                className={`rounded-lg border border-gsx-border px-2 py-1.5 text-center text-[10px] uppercase tracking-wide transition-colors ${
                  active ? "font-bold text-[#0f1210]" : "text-gsx-muted"
                }`}
                style={active ? { background: meta.hue, borderColor: meta.hue } : undefined}
              >
                {meta.label}
              </div>
            );
          })}
        </div>
      )}

      {/* One question per screen */}
      <form id="runner-form" action={action} className="mt-8 flex flex-1 flex-col">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="survey_id" value={survey.id} />
        <input type="hidden" name="participant_code" value={participantCode} />

        {questions.map((qq, i) => (
          <div key={qq.id} className={i === step ? "block" : "hidden"}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-gsx-accent-2">
                {String(qq.ordinal).padStart(2, "0")}
              </span>
              <h2 className="text-2xl font-semibold leading-snug">{qq.prompt}</h2>
            </div>

            <div className="mt-6 space-y-3">
              {qq.question_type === "likert_5" &&
                (qq.options as string[]).map((label) => (
                  <BigChoice key={label} name={fieldId(qq)} value={label} label={label} />
                ))}

              {qq.question_type === "multiple_choice" &&
                (qq.options as string[]).map((label) => (
                  <BigChoice key={label} name={fieldId(qq)} value={label} label={label} />
                ))}

              {qq.question_type === "boolean" && (
                <div className="grid grid-cols-2 gap-4">
                  <BigChoice name={fieldId(qq)} value="true" label="Yes" />
                  <BigChoice name={fieldId(qq)} value="false" label="No" />
                </div>
              )}

              {qq.question_type === "rating_10" && (
                <>
                  <input type="hidden" name={fieldId(qq)} value="" data-rating-slot={qq.id} />
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <RatingButton key={n} name={fieldId(qq)} value={n} />
                    ))}
                  </div>
                </>
              )}

              {qq.question_type === "free_text" && (
                <textarea
                  name={fieldId(qq)}
                  rows={5}
                  className="w-full rounded-xl border border-gsx-border bg-gsx-panel px-4 py-3 text-lg outline-none focus:border-gsx-accent/60"
                  placeholder="Type your answer…"
                />
              )}

              {qq.question_type === "ranking" && (
                <textarea
                  name={fieldId(qq)}
                  rows={4}
                  className="w-full rounded-xl border border-gsx-border bg-gsx-panel px-4 py-3 text-lg outline-none focus:border-gsx-accent/60"
                  placeholder="List the options in order, best first."
                />
              )}
            </div>
          </div>
        ))}

        {!state?.ok && state && <p className="mt-4 text-sm text-gsx-danger">{state.message}</p>}

        <div className="mt-auto flex items-center justify-between pt-10">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border border-gsx-border px-6 py-3 text-sm text-gsx-muted transition-colors hover:text-gsx-text disabled:opacity-30"
          >
            ← Back
          </button>
          {step < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
              className="rounded-xl bg-gsx-accent px-8 py-4 text-lg font-bold text-[#0f1210] transition-opacity hover:opacity-90"
            >
              Next →
            </button>
          ) : (
            <RunnerSubmit />
          )}
        </div>
      </form>
    </div>
  );
}

function BigChoice({ name, value, label }: { name: string; value: string; label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-lg transition-colors ${
        checked ? "border-gsx-accent bg-gsx-accent/15 text-gsx-accent" : "border-gsx-border bg-gsx-panel hover:border-gsx-accent/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => setChecked(true)}
        className="h-5 w-5 accent-[#5aa9e6]"
      />
      {label}
    </label>
  );
}

function RatingButton({ name, value }: { name: string; value: number }) {
  const [picked, setPicked] = useState(false);
  return (
    <label
      className={`flex h-16 cursor-pointer items-center justify-center rounded-xl border text-2xl font-bold transition-colors ${
        picked ? "border-gsx-accent bg-gsx-accent/20 text-gsx-accent" : "border-gsx-border bg-gsx-panel hover:border-gsx-accent/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={String(value)}
        checked={picked}
        onChange={() => setPicked(true)}
        className="sr-only"
      />
      {value}
    </label>
  );
}
