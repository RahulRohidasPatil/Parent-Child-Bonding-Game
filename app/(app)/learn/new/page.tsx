import type { Metadata } from "next";
import { LearnChat } from "./learn-chat";

export const metadata: Metadata = { title: "Ask anything" };

export default function AskPage() {
  return <LearnChat />;
}
