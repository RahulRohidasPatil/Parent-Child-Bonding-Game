"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { EmailLinkErrorCodeStatus, isClerkAPIResponseError, isEmailLinkError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice, Spinner } from "@/components/qn/ui";
import { cn } from "@/lib/utils";

function clerkMessage(error: unknown, fallback: string) {
  if (error instanceof Error && isEmailLinkError(error)) {
    if (error.code === EmailLinkErrorCodeStatus.Expired) {
      return "This verification link has expired. Request a new link and open the newest email.";
    }
    if (error.code === EmailLinkErrorCodeStatus.ClientMismatch) {
      return "This link must be opened in the same browser where registration started.";
    }
    return `Clerk could not verify this link (${error.code}). Request a new link and open it once.`;
  }
  if (isClerkAPIResponseError(error)) {
    return error.errors.map((item) => item.longMessage || item.message).join(" ");
  }
  return fallback;
}

/** Step 2 of sign-up: the link from the confirmation email (sent to the parent for under-16s). */
export function VerifyForm() {
  const params = useSearchParams();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const email = params.get("email") ?? "";
  const minor = params.get("minor") === "1";
  const name = params.get("name") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<string | null>(null);

  async function resend() {
    setResent(null);
    setError(null);
    setBusy(true);
    try {
      if (!signUpLoaded || !signUp) {
        setError("Clerk is still loading. Refresh the page and try again.");
        return;
      }
      const query = new URLSearchParams({ email });
      if (minor) query.set("minor", "1");
      if (name) query.set("name", name);
      const { startEmailLinkFlow } = signUp.createEmailLinkFlow();
      const emailLinkFlow = startEmailLinkFlow({ redirectUrl: `${window.location.origin}/verify/callback?${query.toString()}` });
      setResent("Sent again. Check your email for the verification link.");
      void emailLinkFlow.catch((flowError: unknown) => {
        setError(clerkMessage(flowError, "Couldn’t send the verification link right now."));
      });
    } catch (error) {
      setError(clerkMessage(error, "Couldn’t resend the verification link right now."));
    } finally {
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[26px] font-black">Verify your account</h1>
        <Notice tone="info">Start by creating an account. We’ll send a verification link to your email.</Notice>
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
              ? `${name ? `${name}’s` : "Your"} account switches on when your parent opens the link we sent them.`
              : "Open the link we sent to activate your account."}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-3xl border border-line p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
          <Mail className="size-6 text-brand-ink" strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] font-extrabold text-muted-foreground">{minor ? "Link sent to your parent" : "Link sent to"}</span>
          <span className="text-[17px] font-black break-all">{email}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {error && <Notice>{error}</Notice>}
        {resent && <Notice tone="ok">{resent}</Notice>}
        <Notice tone="info">
          {busy ? <><Spinner /> Sending a new verification link...</> : "When you open the link, this page will finish verification automatically."}
        </Notice>
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" variant="soft" size="pill" onClick={resend} disabled={busy}>Resend email</Button>
          <Link href="/register" className="flex h-11 items-center justify-center rounded-xl border-[1.5px] border-input text-[15px] font-extrabold hover:bg-muted">
            Change email
          </Link>
        </div>
        <p className="text-center text-sm font-bold text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="font-black text-brand-ink">Log in</Link>
        </p>
      </div>
    </div>
  );
}
