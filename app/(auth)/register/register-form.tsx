"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useClientValue } from "@/lib/use-client-value";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Notice, Spinner } from "@/components/qn/ui";
import { cn } from "@/lib/utils";
import { setState } from "@/lib/store";
import { startSession } from "@/lib/use-user";
import { type FieldKey, type RegistrationInput, ADULT_AGE, ageFrom, emailMode, validate } from "@/lib/registration";

const EMPTY: RegistrationInput = { name: "", role: "", dob: "", email: "", parentEmail: "", username: "", password: "", confirm: "" };
const DETAILS_FIELDS: FieldKey[] = ["name", "role", "dob", "email", "parentEmail"];

function todayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function clerkMessage(error: unknown, fallback: string) {
  if (isClerkAPIResponseError(error)) {
    return error.errors.map((item) => item.longMessage || item.message).join(" ");
  }
  return fallback;
}

export function RegisterForm() {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded, signUp } = useSignUp();
  const [f, setF] = useState<RegistrationInput>(EMPTY);
  const [step, setStep] = useState<"details" | "credentials">("details");
  const [tried, setTried] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<{ text: string; demo?: boolean } | null>(null);
  const [serverFields, setServerFields] = useState<Partial<Record<FieldKey, string>>>({});
  const maxDate = useClientValue<string | undefined>(todayISO, undefined); // read the clock in the browser, not at prerender

  // Server-side messages only count while set; typing in a field clears its message.
  const errors: Partial<Record<FieldKey, string>> = { ...validate(f) };
  for (const [k, v] of Object.entries(serverFields)) if (v) errors[k as FieldKey] = v;
  const age = ageFrom(f.dob);
  const hasAge = age !== null && age >= 0;
  const mode = emailMode(f);
  const count = Object.keys(errors).filter((key) => step === "credentials" || DETAILS_FIELDS.includes(key as FieldKey)).length;

  // Show an error once the field has a value (format problems) or after the first submit.
  const show = (k: FieldKey) => (errors[k] && (tried || (k !== "role" && !!f[k])) ? errors[k] : undefined);
  const set = (k: FieldKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setServerFields((s) => ({ ...s, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (count) return;
    if (step === "details") {
      setStep("credentials");
      setTried(false);
      return;
    }
    if (!isLoaded || !signUp) {
      setServerError({ text: "Clerk is still loading. Refresh the page and try again." });
      return;
    }
    setBusy(true);
    try {
      const accountEmail = emailMode(f) === "minor" ? f.parentEmail : f.email;
      const result = await signUp.create({
        emailAddress: accountEmail.trim().toLowerCase(),
        password: f.password,
        username: f.username.trim(),
        unsafeMetadata: {
          display_name: f.name.trim(),
          account_type: f.role === "parent" ? "parent" : "learner",
          birth_date: f.dob,
          parent_email: f.parentEmail.trim().toLowerCase() || null,
        },
      });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        await startSession();
        router.push("/home?welcome=1");
        return;
      }
      setState({ age: hasAge ? age : null });
      const q = new URLSearchParams({ email: accountEmail.trim().toLowerCase(), minor: emailMode(f) === "minor" ? "1" : "0", name: f.name.trim() });
      const { startEmailLinkFlow } = signUp.createEmailLinkFlow();
      const emailLinkFlow = startEmailLinkFlow({ redirectUrl: `${window.location.origin}/verify/callback?${q.toString()}` });
      void emailLinkFlow.catch((flowError: unknown) => {
        setServerError({ text: clerkMessage(flowError, "We could not send the verification link. Request a new one from the verification page.") });
      });
      router.push(`/verify?${q}`);
    } catch (error) {
      setServerError({ text: clerkMessage(error, "We could not create that account. Check your details and try again.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-extrabold text-muted-foreground" role="status">Step {step === "details" ? 1 : 2} of 2</p>
        <h1 className="text-[26px] font-black md:text-[30px]">Create your account</h1>
        <p className="text-[15px] font-bold text-muted-foreground">
          {step === "details" ? "Fill in your details. We verify your email before you can log in." : "Choose a username and password to finish creating your account."}
        </p>
      </div>

      {step === "details" && (
        <>
          <Field label="Name" autoComplete="name" placeholder="First and last name" value={f.name} onChange={set("name")} error={show("name")} />

          <div role="group" aria-labelledby="role-label" className="flex flex-col gap-1.5">
            <span id="role-label" className="text-[13px] font-extrabold text-muted-foreground">Role</span>
            <div className="grid grid-cols-2 gap-2">
              {(["student", "parent"] as const).map((r) => {
                const on = f.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setF((p) => ({ ...p, role: r }))}
                    className={cn(
                      "h-12 rounded-2xl border-[1.5px] text-[15px] font-black",
                      on ? "border-night bg-night text-white" : show("role") ? "border-destructive bg-card" : "border-input bg-card hover:bg-muted",
                    )}
                  >
                    {r === "student" ? "Student" : "Parent"}
                  </button>
                );
              })}
            </div>
            {show("role") && <span className="text-[13px] font-extrabold text-destructive">{show("role")}</span>}
          </div>

          <Field
            label="Date of birth"
            type="date"
            max={maxDate}
            value={f.dob}
            onChange={set("dob")}
            error={show("dob")}
            labelExtra={
              hasAge ? (
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-black", mode === "minor" ? "bg-warn text-warn-ink" : "bg-brand-soft text-brand-ink")}>
                  Age {age}
                  {mode === "minor" ? " · parent approval" : ""}
                </span>
              ) : null
            }
          />

          {mode === "none" && (
            <div className="rounded-2xl border-[1.5px] border-dashed border-input px-3.5 py-3 text-sm font-bold text-muted-foreground">
              Add your date of birth and we’ll show the right email field.
            </div>
          )}
          {mode === "self" && (
            <Field
              label="Enter your email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={f.email}
              onChange={set("email")}
              error={show("email")}
              hint="We’ll send your verification link here."
            />
          )}
          {mode === "minor" && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5 rounded-2xl bg-warn px-3.5 py-3">
                <Info className="mt-0.5 size-5 shrink-0 text-warn-ink" strokeWidth={2.4} />
                <span className="text-sm leading-snug font-bold text-warn-ink">
                  You’re under {ADULT_AGE}, so a parent has to approve your account. We’ll email them a verification link.
                </span>
              </div>
              <Field label="Enter parent’s email" type="email" placeholder="parent@example.com" value={f.parentEmail} onChange={set("parentEmail")} error={show("parentEmail")} />
              <Field
                label={
                  <>
                    Your own email <span className="font-bold">(optional)</span>
                  </>
                }
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={f.email}
                onChange={set("email")}
                error={show("email")}
              />
            </div>
          )}
        </>
      )}

      {step === "credentials" && (
        <>
          <Field label="Set username" autoComplete="username" placeholder="e.g. nova_reads" value={f.username} onChange={set("username")} error={show("username")} />
          <Field
            label="Set password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={f.password}
            onChange={set("password")}
            error={show("password")}
            labelExtra={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} className="h-7 px-1 text-[13px] font-black text-brand-ink">
                {showPw ? "Hide" : "Show"}
              </button>
            }
          />
          <Field
            label="Confirm password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Type it again"
            value={f.confirm}
            onChange={set("confirm")}
            error={show("confirm")}
            hint={f.confirm && f.confirm === f.password && !errors.password ? <span className="font-extrabold text-brand-ink">Passwords match</span> : undefined}
          />
        </>
      )}

      {serverError && (
        <Notice tone={serverError.demo ? "info" : "error"}>
          {serverError.text}{" "}
          {serverError.demo && (
            <Link href="/login" className="font-black underline">
              Go to log in
            </Link>
          )}
        </Notice>
      )}
      {tried && count > 0 && (
        <p role="alert" className="text-center text-sm font-extrabold text-destructive">
          {count === 1 ? "Fix the highlighted field to continue." : `Fix the ${count} highlighted fields to continue.`}
        </p>
      )}

      {step === "credentials" && (
        <Button
          type="button"
          variant="soft"
          size="cta"
          disabled={busy}
          onClick={() => {
            setStep("details");
            setTried(false);
            setServerError(null);
          }}
        >
          Back
        </Button>
      )}
      <Button type="submit" variant="brand" size="cta" disabled={busy}>
        {busy && <Spinner />}
        {step === "details" ? "Next" : "Create account"}
      </Button>
      <p className="text-center text-sm font-bold text-muted-foreground">
        Have an account?{" "}
        <Link href="/login" className="font-black text-brand-ink">
          Log in
        </Link>
      </p>
    </form>
  );
}
