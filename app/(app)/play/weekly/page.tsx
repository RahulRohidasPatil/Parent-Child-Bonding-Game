"use client";
import { useEffect, useState } from "react";
import { Page } from "@/components/qn/app-shell";
import { Card, Notice, PageHeader, Segmented, Spinner } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { http } from "@/lib/learn-api";
type Preview = { preview: boolean; notice: string; topic: string; blurb: string; week: Record<string,string>; samples_ready: Record<string,boolean>; games: { game?: string; id?: string; name?: string; title?: string; how?: string }[]; example_leaderboard: { rank: number; name: string; score: number }[] };
export default function WeeklyPage() {
  const [which,setWhich]=useState<"current"|"next">("next"); const [band,setBand]=useState("10-12"); const [data,setData]=useState<Preview|null>(null); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  useEffect(()=>{let live=true; http.get<Preview>(`weekly/${which}?band=${band}`).then((r)=>live&&setData(r)).catch((e)=>live&&setError(e.message));return()=>{live=false;};},[which,band]);
  async function prepare(){setBusy(true);setError(null);try{await http.post("weekly/next/prepare",{band});setData(await http.get<Preview>(`weekly/${which}?band=${band}`));}catch(e){setError(e instanceof Error?e.message:"Couldn’t prepare the samples.");}finally{setBusy(false);}}
  return <Page><PageHeader title="Weekly challenge" sub="Preview the next shared topic" back={{href:"/play",label:"Back to Play"}}/>{error&&<Notice>{error}</Notice>}
    <Segmented label="Week" value={which} onChange={setWhich} options={[{value:"current",label:"This week"},{value:"next",label:"Next week"}]}/>
    <label className="font-bold">Age group <select className="rounded-xl border border-line bg-card p-3" value={band} onChange={(e)=>setBand(e.target.value)}>{["10-12","13-15","16-18"].map((x)=><option key={x}>{x}</option>)}</select></label>
    {!data?<Spinner/>:<><Notice>{data.notice}</Notice><Card className="flex flex-col gap-3 p-5"><h2 className="text-2xl font-black">{data.topic}</h2><p>{data.blurb}</p><span>{Object.values(data.week).join(" · ")}</span>{data.games.map((g,i)=><p key={i}><b>{g.name??g.title??g.game??g.id}</b> {g.how}</p>)}<p>Prepared samples: {Object.entries(data.samples_ready).filter(([,v])=>v).map(([k])=>k).join(", ")||"None yet"}</p>{which==="next"&&<Button variant="brand" disabled={busy} onClick={prepare}>{busy?"Preparing samples…":"Prepare activity samples"}</Button>}</Card><Card className="flex flex-col gap-2 p-5"><h2 className="font-black">Example leaderboard</h2><p className="text-sm text-muted-foreground">Illustrative only. Weekly competitive play is not open yet.</p>{data.example_leaderboard.map((r)=><div key={r.rank} className="flex gap-3"><b>{r.rank}</b><span className="flex-1">{r.name}</span><span>{r.score}</span></div>)}</Card></>}
  </Page>;
}
