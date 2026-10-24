"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Notice, Spinner } from "@/components/qn/ui";
import { cn } from "@/lib/utils";

/** Step 2 of sign-up: the code from the confirmation email (sent to the parent for under-16s). */
export function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const minor = params.get("minor") === "1";
  const name = params.get("name") ?? "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<string | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.replace(/\s/g, "").length < 6) return setError("Enter the code from the email.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token: code }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/home?welcome=1");
        return;
      }
      setError(body.detail || "Couldn’t verify the code. Try again.");
    } catch {
      setError("You seem to be offline. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResent(null);
    setError(null);
    const res = await fetch("/api/auth/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    if (res?.ok) setResent("Sent again. It can take a minute to arrive.");
    else setError((await res?.json().catch(() => null))?.detail || "Couldn’t resend right now.");
  }

  if (!email) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[26px] font-black">Verify your account</h1>
        <Notice tone="info">Start by creating an account. We’ll send a code to your email.</Notice>
        <Link href="/register" className="text-center font-black text-brand-ink">Create an account</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="grid grid-cols-3 gap-1.5" aria-label="Sign-up progress: step 2 of 3">
        {[1, 2, 3].map((n) => (
          <li key={n} className={cn("h-1.5 rounded-full", n <= 2 ? "bg-brand" : "bg-line")} />
        ))}
      </ol>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-black md:text-[30px]">{minor ? "Ask a parent to approve" : "Check your email"}</h1>
        <p className="text-[15px] font-bold text-muted-foreground">
          {minor
            ? `${name ? `${name}’s` : "Your"} account switches on when your parent enters the code we sent them.`
            : "Enter the code we sent to activate your account."}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-3xl border border-line p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
          <Mail className="size-6 text-brand" strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] font-extrabold text-muted-foreground">{minor ? "Code sent to your parent" : "Code sent to"}</span>
          <span className="text-[17px] font-black break-all">{email}</span>
        </span>
      </div>

      <form onSubmit={verify} noValidate className="flex flex-col gap-4">
        <Field
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="[&_input]:text-center [&_input]:text-xl [&_input]:tracking-[.3em]"
        />
        {error && <Notice>{error}</Notice>}
        {resent && <Notice tone="ok">{resent}</Notice>}
        <Button type="submit" variant="brand" size="cta" disabled={busy}>
          {busy && <Spinner />}
          {minor ? "Approve account" : "Verify account"}
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" variant="soft" size="pill" onClick={resend}>Resend email</Button>
          <Link href="/register" className="flex h-11 items-center justify-center rounded-xl border-[1.5px] border-input text-[15px] font-extrabold hover:bg-muted">
            Change email
          </Link>
        </div>
        <p className="text-center text-sm font-bold text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="font-black text-brand-ink">Log in</Link>
        </p>
      </form>
    </div>
  );
}
