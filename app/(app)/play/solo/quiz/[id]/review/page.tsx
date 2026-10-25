import { Suspense } from "react";
import { QuizReview } from "./review-screen";
export default function Page({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p className="p-8">Loading review…</p>}>{params.then(({id})=><QuizReview key={id} id={id}/>)}</Suspense>;}
