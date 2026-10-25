import { Suspense } from "react";
import { RoomsScreen } from "./rooms-screen";
export default function RoomsPage() { return <Suspense fallback={<p className="p-8">Loading games…</p>}><RoomsScreen /></Suspense>; }
