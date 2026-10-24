import type { Metadata } from "next";
import { LearnHub } from "./learn-hub";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnHub />;
}
