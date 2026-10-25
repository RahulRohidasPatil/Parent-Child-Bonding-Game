"use client";

import { useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { EmailLinkErrorCodeStatus, isClerkAPIResponseError, isEmailLinkError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Notice, Spinner } from "@/components/qn/ui";

function errorMessage(error: unknown) {
  if (error instanceof Error && isEmailLinkError(error)) {
    if (error.code === EmailLinkErrorCodeStatus.Expired) return "This verification link has expired. Request a new link.";
    if (error.code === EmailLinkErrorCodeStatus.ClientMismatch) return "Open this link in the same browser where registration started.";
    return `Clerk could not verify this link (${error.code}). Request a new link.`;
  }
  if (isClerkAPIResponseError(error)) {
    return error.errors.map((item) => item.longMessage || item.message).join(" ");
  }
  return "That verification link is invalid or has expired. Request a new one.";
}

export default function VerifyCallbackPage() {
  const router = useRouter();
  const { handleEmailLinkVerification, loaded } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!loaded || started.current) return;
    started.current = true;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setError("Verification is taking too long. Request a new link and open the newest email in this browser.");
    }, 15000);
    void handleEmailLinkVerification({
      redirectUrlComplete: `${window.location.origin}/home?welcome=1`,
      redirectUrl: `${window.location.origin}/verify`,
      onVerifiedOnOtherDevice: () => {
        if (!cancelled) setError("Open this link in the same browser where registration started.");
      },
    }).then(() => {
      if (!cancelled) {
        window.clearTimeout(timeout);
        router.replace("/home?welcome=1");
      }
    }).catch((verificationError: unknown) => {
      window.clearTimeout(timeout);
      if (!cancelled) setError(errorMessage(verificationError));
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [handleEmailLinkVerification, loaded, router]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[26px] font-black">Verification failed</h1>
        <Notice>{error}</Notice>
        <Link href="/register" className="text-center font-black text-brand-ink">Start again</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[26px] font-black">Verifying your email</h1>
      <Notice tone="info"><Spinner /> Completing your account setup...</Notice>
    </div>
  );
}
