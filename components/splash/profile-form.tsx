"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AVATAR_COLORS, type Profile } from "@/lib/game/types";
import { Blob } from "./blob";
import { Eyebrow } from "./screen";

export const EMPTY_PROFILE: Profile = { name: "", color: "sun", role: "grownup" };

/** Name + Splashie colour + grown-up/kid. Controlled so pages own submit. */
export function ProfileFields({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (next: Profile) => void;
}) {
  const nameId = useId();
  const [touched, setTouched] = useState(false);
  const nameMissing = touched && !value.name.trim();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Blob color={value.color} size={112} className="animate-float" title="Your Splashie" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={nameId}>
          <Eyebrow>Your name</Eyebrow>
        </label>
        <Input
          id={nameId}
          value={value.name}
          maxLength={14}
          autoComplete="nickname"
          placeholder="e.g. Mom, Leo, Grandpa"
          aria-invalid={nameMissing || undefined}
          onBlur={() => setTouched(true)}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="h-14 rounded-2xl bg-white/6 px-4 font-heading text-xl md:text-xl"
        />
        {nameMissing && <p className="text-sm text-destructive">Pick a name so everyone knows who you are.</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">
          <Eyebrow>Pick your colour</Eyebrow>
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_COLORS.map((c) => {
            const selected = value.color === c;
            return (
              <label
                key={c}
                className={cn(
                  "relative grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-transparent bg-white/5 transition",
                  "has-focus-visible:ring-3 has-focus-visible:ring-ring/60",
                  selected && "border-foreground bg-white/12",
                )}
              >
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={selected}
                  onChange={() => onChange({ ...value, color: c })}
                  className="sr-only"
                  aria-label={c}
                />
                <Blob color={c} size={36} mood={selected ? "happy" : "sleepy"} />
                {selected && (
                  <Check className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-foreground p-0.5 text-ink" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">
          <Eyebrow>I&apos;m a…</Eyebrow>
        </legend>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1.5">
          {(
            [
              ["grownup", "Grown-up", "🧑"],
              ["kid", "Kid", "🧒"],
            ] as const
          ).map(([role, label, emoji]) => (
            <label
              key={role}
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl font-heading text-lg font-semibold text-muted-foreground transition",
                "has-focus-visible:ring-3 has-focus-visible:ring-ring/60",
                value.role === role && "bg-foreground text-ink",
              )}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={value.role === role}
                onChange={() => onChange({ ...value, role })}
                className="sr-only"
              />
              <span aria-hidden>{emoji}</span> {label}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Every secret word comes with a picture, so early readers can play too.
        </p>
      </fieldset>
    </div>
  );
}

export const isProfileValid = (p: Profile) => p.name.trim().length > 0;

/**
 * Profile editor that starts collapsed to a "Playing as …" chip when the
 * device already has a saved profile.
 */
export function ProfilePicker({
  saved,
  value,
  onChange,
}: {
  saved: Profile | null;
  value: Profile;
  onChange: (next: Profile) => void;
}) {
  const [editing, setEditing] = useState(false);
  if (saved && !editing) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
        <Blob color={value.color} size={52} />
        <div className="min-w-0 flex-1">
          <Eyebrow>Playing as</Eyebrow>
          <p className="truncate font-heading text-xl font-semibold">{value.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
        >
          Change
        </button>
      </div>
    );
  }
  return <ProfileFields value={value} onChange={onChange} />;
}
