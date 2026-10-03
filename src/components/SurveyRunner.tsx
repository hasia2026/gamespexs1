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

function RunnerSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
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
  // No-skip rule: every answer is tracked so the operator cannot advance past
  // an unanswered field. Back (review) stays available; forward does not.
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
  const isAnswered = (qq: SurveyQuestion) => (answers[fieldId(qq)] ?? "").trim().length > 0;
  const setAnswer = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  // Every question belongs to a quadrant cell of the on-screen matrix; derive
  // from the routing engine's quadrant, falling back to the ordinal slot.
  const quadOf = (qq: SurveyQuestion): keyof typeof QUAD_META => {
    if (qq.quadrant && qq.quadrant in QUAD_META) return qq.quadrant;
    return `q${((qq.ordinal - 1) % 4) + 1}` as keyof typeof QUAD_META;
  };

  if (state?.ok) {
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <div className="text-7xl">🎯</div>
        <h1 className="mt-6 text-3xl font-bold">Thank you!</h1>
        <p className="mt-2 text-lg text-gsx-muted">{state.message}</p>
      </div>
    );
  }

  const current = questions[step];
  const currentQuad = current ? QUAD_META[quadOf(current)] : null;

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col">
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
            }}
          />
        </div>
      </div>

      {/* Strict 4-quadrant symmetrical matrix — every interface element lives in
          one of the four cells, aligned to the catalog's quadrant fields. */}
      <div className="mt-6 grid flex-1 grid-cols-2 grid-rows-2 gap-3">
        {(["q1", "q2", "q3", "q4"] as const).map((code) => {
          const meta = QUAD_META[code];
          const isActive = !!current && quadOf(current) === code;
          return (
            <section
              key={code}
              aria-current={isActive ? "step" : undefined}
              className={`flex min-h-[230px] flex-col rounded-xl border p-4 transition-colors ${
                isActive
                  ? "border-2 bg-[#151a17]"
                  : "border-gsx-border/60 bg-gsx-panel/40"
              }`}
              style={isActive ? { borderColor: meta.hue } : undefined}
            >
              <div
                className={`rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? "text-[#0f1210]" : "text-gsx-muted"
                }`}
                style={isActive ? { background: meta.hue } : undefined}
              >
                {meta.label}
              </div>

              {isActive ? (
                <div className="mt-3 flex flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-gsx-accent-2">
                      {String(current!.ordinal).padStart(2, "0")}
                    </span>
                    {current!.phase === "play_history" ? (
                      <span className="rounded-full border border-gsx-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gsx-muted">
                        Play history
                      </span>
                    ) : (
                      <span className="rounded-full border border-gsx-accent/40 bg-gsx-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gsx-accent">
                        Post-game
                      </span>
                    )}
                    {current!.custom_slot && (
                      <span className="rounded-full border border-gsx-gold/40 bg-gsx-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gsx-gold">
                        Custom field · {current!.custom_slot.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Verbatim display: prompts wrap fully — never truncated. */}
                  <h2 className="mt-2 min-w-0 text-xl font-semibold leading-snug break-words md:text-2xl">
                    {current!.prompt}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {(current!.question_type === "likert_5" ||
                      current!.question_type === "multiple_choice") &&
                      (current!.options as string[]).map((label) => (
                        <BigChoice
                          key={label}
                          name={fieldId(current!)}
                          value={label}
                          label={label}
                          checked={answers[fieldId(current!)] === label}
                          onSelect={(v) => setAnswer(fieldId(current!), v)}
                        />
                      ))}

                    {current!.question_type === "boolean" && (
                      <div className="grid grid-cols-2 gap-4">
                        <BigChoice
                          name={fieldId(current!)}
                          value="true"
                          label="Yes"
                          checked={answers[fieldId(current!)] === "true"}
                          onSelect={(v) => setAnswer(fieldId(current!), v)}
                        />
                        <BigChoice
                          name={fieldId(current!)}
                          value="false"
                          label="No"
                          checked={answers[fieldId(current!)] === "false"}
                          onSelect={(v) => setAnswer(fieldId(current!), v)}
                        />
                      </div>
                    )}

                    {current!.question_type === "rating_10" && (
                      <div className="grid grid-cols-5 gap-3">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <RatingButton
                            key={n}
                            name={fieldId(current!)}
                            value={n}
                            checked={answers[fieldId(current!)] === String(n)}
                            onSelect={(v) => setAnswer(fieldId(current!), v)}
                          />
                        ))}
                      </div>
                    )}

                    {(current!.question_type === "free_text" ||
                      current!.question_type === "ranking") && (
                      <textarea
                        name={fieldId(current!)}
                        rows={current!.question_type === "free_text" ? 4 : 3}
                        autoComplete="off"
                        data-1p-ignore="true"
                        value={answers[fieldId(current!)] ?? ""}
                        onChange={(e) => setAnswer(fieldId(current!), e.target.value)}
                        className="w-full rounded-xl border border-gsx-border bg-gsx-panel px-4 py-3 text-lg outline-none focus:border-gsx-accent/60"
                        placeholder={
                          current!.question_type === "free_text"
                            ? "Type your answer…"
                            : "List the options in order, best first."
                        }
                      />
                    )}
                  </div>

                  <p className="mt-3 text-[11px] text-gsx-muted">
                    Read each question fully — fields can&apos;t be skipped or auto-filled.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center px-2 text-center">
                  <p className="text-xs text-gsx-muted/70">
                    Locked — answer the active question to continue.
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* All questions stay mounted (hidden) so the time-limit auto-submit
          still captures everything answered so far. */}
      <form id="runner-form" action={action} className="hidden" autoComplete="off">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="survey_id" value={survey.id} />
        <input type="hidden" name="participant_code" value={participantCode} />
        {questions.map((qq) => (
          <input key={qq.id} type="hidden" name={fieldId(qq)} value={answers[fieldId(qq)] ?? ""} />
        ))}
      </form>

      {!state?.ok && state && <p className="mt-4 text-sm text-gsx-danger">{state.message}</p>}

      <div className="mt-4 flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-gsx-border px-6 py-3 text-sm text-gsx-muted transition-colors hover:text-gsx-text disabled:opacity-30"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {!isAnswered(current!) && (
            <span className="text-xs text-gsx-muted">Answer this question to continue →</span>
          )}
          {step < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
              disabled={!isAnswered(current!)}
              className="rounded-xl bg-gsx-accent px-8 py-4 text-lg font-bold text-[#0f1210] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          ) : (
            <RunnerSubmit disabled={!isAnswered(current!)} />
          )}
        </div>
      </div>
    </div>
  );
}

function BigChoice({
  name,
  value,
  label,
  checked,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-lg transition-colors ${
        checked
          ? "border-gsx-accent bg-gsx-accent/15 text-gsx-accent"
          : "border-gsx-border bg-gsx-panel hover:border-gsx-accent/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="h-5 w-5 accent-[#5aa9e6]"
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function RatingButton({
  name,
  value,
  checked,
  onSelect,
}: {
  name: string;
  value: number;
  checked: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <label
      className={`flex h-16 cursor-pointer items-center justify-center rounded-xl border text-2xl font-bold transition-colors ${
        checked
          ? "border-gsx-accent bg-gsx-accent/20 text-gsx-accent"
          : "border-gsx-border bg-gsx-panel hover:border-gsx-accent/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={String(value)}
        checked={checked}
        onChange={() => onSelect(String(value))}
        className="sr-only"
      />
      {value}
    </label>
  );
}
