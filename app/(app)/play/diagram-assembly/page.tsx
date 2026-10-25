import type { Metadata } from "next";
import { DiagramAssemblyScreen } from "./diagram-assembly-screen";

export const metadata: Metadata = { title: "Diagram Assembly" };

export default function DiagramAssemblyPage() {
  return <DiagramAssemblyScreen />;
}
