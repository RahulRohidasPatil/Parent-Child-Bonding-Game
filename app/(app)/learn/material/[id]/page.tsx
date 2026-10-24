import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { MaterialScreen } from "./material-screen";

export const metadata: Metadata = { title: "Check your notes" };

export default function MaterialPage({ params }: PageProps<"/learn/material/[id]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id }) => (
        <MaterialScreen id={id} />
      ))}
    </Suspense>
  );
}
