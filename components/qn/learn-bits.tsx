"use client";

import { cn } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";

export function SubjectPicker({ className }: { className?: string }) {
  const subject = useQN((s) => s.subject);
  return (
    <div role="radiogroup" aria-label="Subject" className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      {SUBJECTS.map((s) => {
        const on = s.id === subject;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setState({ subject: s.id as Subject })}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-black whitespace-nowrap",
              on ? "bg-brand text-white" : "border border-line bg-card hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** Steps shown at the top of the learn flow: choose → check → learn. */
export function LearnSteps({ step }: { step: 1 | 2 | 3 }) {
  const names = ["Choose", "Check", "Learn"];
  return (
    <div className="flex flex-col gap-2" aria-label={`Step ${step} of 3: ${names[step - 1]}`}>
      <span className="text-[13px] font-black text-muted-foreground">
        Step {step} of 3 · {names[step - 1]}
      </span>
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-1.5 rounded-full", n <= step ? "bg-brand" : "bg-line")} />
        ))}
      </div>
    </div>
  );
}

/**
 * The signed-in learner's age for lesson reading level: from the account's date of birth,
 * else the age saved in this browser (at sign-up or in Settings). Null when neither is known.
 */
export function useLearnerAge(): { age: number | null; loading: boolean } {
  const { user, loading } = useUser();
  const localAge = useQN((s) => s.age);
  return { age: user?.age ?? localAge ?? null, loading };
}

/** Age sets the lesson's reading level. Stored locally (the auth API doesn't keep date of birth). */
export function AgeInput({ className }: { className?: string }) {
  const age = useQN((s) => s.age);
  return (
    <label className={cn("flex items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-2.5", className)}>
      <span className="flex-1 text-[14px] leading-snug font-extrabold">
        Age for reading level
        <span className="block text-[13px] font-bold text-muted-foreground">Lessons are written for this age.</span>
      </span>
      <input
        type="number"
        min={5}
        max={99}
        inputMode="numeric"
        value={age ?? ""}
        placeholder="12"
        onChange={(e) => {
          const n = Number(e.target.value);
          setState({ age: e.target.value === "" ? null : Math.max(5, Math.min(99, Math.round(n))) });
        }}
        className="h-11 w-20 rounded-xl border-[1.5px] border-input bg-field text-center text-lg font-black outline-none focus-visible:border-brand"
      />
    </label>
  );
}

export function SwitchRow({ label, note, checked, onChange }: { label: string; note?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span className="flex flex-1 flex-col leading-snug">
        <span className="text-[15px] font-extrabold">{label}</span>
        {note && <span className="text-[13px] font-bold text-muted-foreground">{note}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-input")}
      >
        <span className={cn("absolute top-[3px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(31,45,58,.25)] transition-[left]", checked ? "left-[23px]" : "left-[3px]")} />
      </button>
    </div>
  );
}
