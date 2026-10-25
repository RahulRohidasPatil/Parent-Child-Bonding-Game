import { Suspense } from "react";
import { RebuildScreen } from "./rebuild-screen";
export default function RebuildPage(){return <Suspense fallback={<p className="p-8">Loading…</p>}><RebuildScreen/></Suspense>;}
