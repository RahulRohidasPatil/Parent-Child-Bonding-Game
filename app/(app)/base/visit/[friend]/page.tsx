import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { VisitScreen } from "./visit-screen";

export const metadata: Metadata = { title: "Visit a home" };

export default function VisitPage({ params }: PageProps<"/base/visit/[friend]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ friend }) => (
        <VisitScreen id={friend} />
      ))}
    </Suspense>
  );
}
