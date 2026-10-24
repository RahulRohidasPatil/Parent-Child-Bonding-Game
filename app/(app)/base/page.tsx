import type { Metadata } from "next";
import { BaseScreen } from "./base-screen";

export const metadata: Metadata = { title: "My base" };

export default function BasePage() {
  return <BaseScreen />;
}
