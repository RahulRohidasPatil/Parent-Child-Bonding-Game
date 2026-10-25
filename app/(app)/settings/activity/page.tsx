"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Page } from "@/components/qn/app-shell";
import { Card,Notice,PageHeader } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { http } from "@/lib/learn-api";
import { getAccountKey,DEFAULT_STATE,setState } from "@/lib/store";
type Progress={lessons_completed:number;quiz_answers:number;correct_answers:number;flashcard_reviews:number;tournaments_submitted:number};
type Wallet={coins:number;next_cursor:number|null;transactions:{id:number;delta:number;reason:string;created_at:string}[]};
export default function ActivityPage(){
 const router=useRouter();
 const [subjects,setSubjects]=useState<{subject:string;conversations:number;topics:{conversation_id:string;title:string;messages:number}[]}[]>([]);
 useEffect(()=>{void http.get<{subjects:typeof subjects}>("memory/digest").then((r)=>setSubjects(r.subjects)).catch(()=>undefined);},[]);
 const [progress,setProgress]=useState<Progress|null>(null),[wallet,setWallet]=useState<Wallet|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{void http.get<Progress>("me/progress").then(setProgress).catch((e)=>setError(e.message));void http.get<Wallet>("me/wallet?limit=30").then(setWallet).catch((e)=>setError(e.message));},[]);
 async function remove(){if(!window.confirm("Delete all saved learning, games, friends, purchases and coins for this account? This cannot be undone."))return;setBusy(true);const account=getAccountKey();try{await http.del("me/data");if(getAccountKey()===account)setState({...DEFAULT_STATE});router.replace("/home");}catch(e){setError(e instanceof Error?e.message:"Couldn’t delete your data.");setBusy(false);}}
 return <Page><PageHeader title="My activity" sub="Saved learning and wallet history" back={{href:"/settings",label:"Back to Settings"}}/>{error&&<Notice>{error}</Notice>}{progress&&<Card className="grid grid-cols-2 gap-4 p-5">{Object.entries(progress).map(([key,value])=><div key={key}><span className="text-2xl font-black">{value}</span><p className="text-sm capitalize">{key.replaceAll("_"," ")}</p></div>)}</Card>}{wallet&&<Card className="flex flex-col gap-3 p-5"><h2 className="text-xl font-black">{wallet.coins} coins</h2>{wallet.transactions.map((t)=><div key={t.id} className="flex gap-3"><span className="flex-1 capitalize">{t.reason.replaceAll("_"," ")}</span><span>{new Date(t.created_at).toLocaleDateString()}</span><b>{t.delta>0?"+":""}{t.delta}</b></div>)}{wallet.next_cursor&&<Button variant="soft" onClick={()=>{void http.get<Wallet>(`me/wallet?after=${wallet.next_cursor}&limit=30`).then((next)=>setWallet({...next,transactions:[...wallet.transactions,...next.transactions]})).catch((e)=>setError(e.message));}}>More history</Button>}</Card>}
 <Card className="flex flex-col gap-3 p-5"><h2 className="font-black">Subjects studied</h2>{subjects.map((s)=><div key={s.subject}><b>{s.subject}</b><p>{s.conversations} saved conversations</p>{s.topics.map((t)=><p key={t.conversation_id}>{t.title} · {t.messages} messages</p>)}</div>)}</Card>
 <Link className="font-bold text-brand-ink" href="/learn/queue">View background learning tasks</Link><Link className="font-bold text-brand-ink" href="/settings/family">Family approval requests</Link><Button variant="soft" disabled={busy} className="text-destructive" onClick={remove}>Delete my saved app data</Button><p className="text-sm text-muted-foreground">Sign-in accounts and approval requests are managed separately.</p></Page>;
}
