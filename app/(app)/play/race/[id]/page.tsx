import { Suspense } from "react";
import { RaceScreen } from "./race-screen";
export default function Page({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p className="p-8">Loading…</p>}>{params.then(({id})=><RaceScreen key={id} id={id}/>)}</Suspense>;}
