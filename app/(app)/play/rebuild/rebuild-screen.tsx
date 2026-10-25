"use client";
import { useEffect,useState } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { Page } from "@/components/qn/app-shell";
import { Card,Notice,PageHeader } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { diagramApi } from "@/lib/diagram-api";
import { gamesApi,type Room } from "@/lib/games-api";
import { homeApi } from "@/lib/home-api";
import { http,learnApi,type PublicLesson,ApiError } from "@/lib/learn-api";
import { useUser } from "@/lib/use-user";
const field="rounded-xl border border-line bg-card p-3";
export function RebuildScreen(){
 const router=useRouter(),params=useSearchParams();const {user}=useUser();const [me,setMe]=useState("");const [room,setRoom]=useState<Room|null>(null);const [code,setCode]=useState("");
 const [lessons,setLessons]=useState<{id:string;title?:string}[]>([]);const [lessonId,setLesson]=useState(params.get("lesson")??"");const [lesson,setData]=useState<PublicLesson|null>(null);const [visual,setVisual]=useState(params.get("visual")??"");const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{void homeApi.mine().then((r)=>setMe(r.owner.id)).catch((e)=>setError(e.message));void http.get<{items:{id:string;title?:string}[]}>("resources/lessons?limit=100").then((r)=>setLessons(r.items)).catch((e)=>setError(e.message));},[]);
 useEffect(()=>{if(lessonId)void learnApi.getLesson(lessonId).then(setData).catch((e)=>setError(e.message));},[lessonId]);
 useEffect(()=>{if(!room)return;const load=async()=>{try{setRoom(await gamesApi.room(room.id));const race=await diagramApi.current(room.id).catch((e)=>{if(e instanceof ApiError&&[404,503].includes(e.status))return null;throw e;});if(race&&["waiting","countdown","running"].includes(race.status))router.replace(`/play/race/${race.id}`);}catch(e){setError(e instanceof Error?e.message:"Couldn’t update room.");}};const t=setInterval(load,2000);return()=>clearInterval(t);},[room?.id,router]); // eslint-disable-line react-hooks/exhaustive-deps
 async function run(fn:()=>Promise<void>){setBusy(true);setError(null);try{await fn();}catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}}
 return <Page><PageHeader title="Rebuild a diagram" sub="Study a saved diagram, then race to restore its labels" back={{href:"/play",label:"Back to Play"}}/>{error&&<Notice>{error}</Notice>}
 {!room?<Card className="flex flex-col gap-3 p-5"><Button variant="brand" disabled={busy||!user} onClick={()=>run(async()=>setRoom(await gamesApi.createRoom(user?.name??"Player",8)))}>Create room</Button><label>Room code<input className={`${field} ml-2 uppercase`} value={code} maxLength={8} onChange={(e)=>setCode(e.target.value)}/></label><Button variant="soft" disabled={busy||code.length!==8} onClick={()=>run(async()=>setRoom(await gamesApi.join(code,user?.name??"Player")))}>Join room</Button></Card>:<Card className="flex flex-col gap-3 p-5"><h2 className="text-xl font-black">Room {room.code}</h2>{room.members.map((m)=><p key={m.user_id}>{m.display_name} · {m.ready?"Ready":"Not ready"}</p>)}<Button variant="soft" disabled={busy} onClick={()=>run(async()=>setRoom(await gamesApi.command(room,"ready",!room.members.find((m)=>m.user_id===me)?.ready)))}>Toggle ready</Button>
 {room.host_id===me&&<><label>Lesson<select className={`${field} ml-2`} value={lessonId} onChange={(e)=>{setLesson(e.target.value);setVisual("");}}><option value="">Choose a lesson</option>{lessons.map((l)=><option key={l.id} value={l.id}>{l.title??l.id}</option>)}</select></label><label>Diagram<select className={`${field} ml-2`} value={visual} onChange={(e)=>setVisual(e.target.value)}><option value="">Choose a saved diagram</option>{lesson?.visuals.filter((v)=>v.kind==="diagram").map((v)=><option key={v.id} value={v.id}>{v.title}</option>)}</select></label><Button variant="brand" disabled={busy||!lesson||!visual||room.members.some((m)=>!m.ready)} onClick={()=>run(async()=>{await learnApi.approveLesson(lessonId,lesson?.revision??1);const t=await diagramApi.template(lessonId,visual);const race=await diagramApi.create(t.id,room.id,room.version);router.push(`/play/race/${race.id}`);})}>{busy?"Preparing diagram…":"Prepare shared diagram"}</Button></>}
 <Button variant="ghost" disabled={busy} onClick={()=>run(async()=>{await gamesApi.command(room,"leave");setRoom(null);})}>Leave room</Button></Card>}
 </Page>;
}
