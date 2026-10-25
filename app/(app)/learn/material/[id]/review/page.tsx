import { Suspense } from "react";
import { MaterialReview } from "./review-screen";
export default function Page({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p className="p-8">Loading notes…</p>}>{params.then(({id})=><MaterialReview key={id} id={id}/>)}</Suspense>;}
