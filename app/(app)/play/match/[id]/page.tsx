import { Suspense } from "react";
import { MatchScreen } from "./match-screen";
export default function Page({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p className="p-8">Loading…</p>}>{params.then(({id})=><MatchScreen key={id} id={id}/>)}</Suspense>;}
