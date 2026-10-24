import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your account" };

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
