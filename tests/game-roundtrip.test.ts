import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
const auth = vi.hoisted(() => ({ who: "alice", players: {} as Record<string,{id:string;playerId:string;token:string}> }));
vi.mock("@clerk/nextjs/server",()=>({auth:async()=>{const p=auth.players[auth.who];return {userId:p.id,sessionId:`sess_${auth.who}`,sessionClaims:{player_id:p.playerId,username:auth.who},getToken:async()=>p.token};},clerkClient:vi.fn(()=>{throw new Error("No provider calls in this fixture");})}));
const file=process.env.GAME_INTEGRATION_FIXTURE;
const fixture=file?JSON.parse(readFileSync(file,"utf8")) as {url:string;players:typeof auth.players}:null;
describe.skipIf(!fixture)("two-player game rounds through the frontend proxy",()=>{
 let routes:typeof import("../app/api/[...path]/route");let social:typeof import("../app/api/social/[...path]/route");
 beforeAll(async()=>{if(new URL(fixture!.url).hostname!=="127.0.0.1")throw new Error("Loopback fixture only");expect((await(await fetch(`${fixture!.url}/__fixture/info`)).json()).synthetic).toBe(true);vi.stubEnv("LEARNING_API_URL",fixture!.url);auth.players=fixture!.players;routes=await import("../app/api/[...path]/route");social=await import("../app/api/social/[...path]/route");});
 async function call(method:"GET"|"POST"|"PUT",path:string,who="alice",body?:unknown){auth.who=who;const url=new URL(`http://frontend.test/api/${path}`);const req=Object.assign(new Request(url,{method,...(body!==undefined?{headers:{"content-type":"application/json"},body:JSON.stringify(body)}:{})}),{nextUrl:url}) as NextRequest;const selected=path.startsWith("social/")?social:routes;return selected[method](req,{params:Promise.resolve({path:path.replace(/^social\//,"").split("/")})});}
 const advance=(milliseconds:number)=>fetch(`${fixture!.url}/__fixture/advance`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({milliseconds})});
 it("finishes Heads-up and Diagram rounds, hides secrets, and pays participation once",async()=>{
  for(const who of ["alice","bob","carol"]){expect((await call("PUT","social/me",who,{display_name:who,avatar:"nova",role:"learner"})).status).toBe(200);expect((await call("PUT","memory/profile",who,{display_name:who,role:"learner"})).status).toBe(200);}
  const room=await(await call("POST","rooms","alice",{display_name:"alice",capacity:4})).json();
  const joined=await(await call("POST","rooms/join","bob",{display_name:"bob",code:room.code})).json();
  const ready=await(await call("POST",`rooms/${room.id}/commands`,"alice",{action:"ready",ready:true,expected_version:joined.version})).json();
  expect((await call("POST",`rooms/${room.id}/commands`,"bob",{action:"ready",ready:true,expected_version:ready.version})).status).toBe(200);
  const hc=await(await call("POST","challenges","alice",{game:"heads_up",topic:"Plants",age:12,room_id:room.id})).json();
  const hm=await(await call("POST","matches","alice",{challenge_id:hc.id,mode:"friends"})).json();
  expect((await(await call("GET",`rooms/${room.id}/match`,"bob")).json()).id).toBe(hm.id);
  expect((await call("GET",`matches/${hm.id}`,"carol")).status).toBe(404);
  await call("POST",`matches/${hm.id}/start`);await advance(6000);
  const a=await(await call("GET",`matches/${hm.id}`)).json();const b=await(await call("GET",`matches/${hm.id}`,"bob")).json();
  expect(a.view.turn.you_are).toBe("guesser");expect(b.view.turn.you_are).toBe("explainer");expect(a.view.turn.card.term).toBe(b.view.turn.card.term);
  expect((await call("POST",`matches/${hm.id}/cards`,"bob",{card_index:0,action:"correct"})).status).toBe(200);
  expect((await(await call("POST",`matches/${hm.id}/cards`,"alice",{card_index:0,action:"correct"})).json()).replayed).toBe(true);
  await advance(45000);await call("POST",`matches/${hm.id}/cards`,"alice",{card_index:1,action:"skip"});await advance(31000);
  const hresults=await(await call("GET",`matches/${hm.id}/results`)).json();expect(hresults.ranking[0].score).toBe(1);
  for(const who of ["alice","bob"]){expect((await(await call("POST","me/coins/claim-participation",who,{source:"match",id:hm.id})).json()).credited).toBe(20);expect((await(await call("POST","me/coins/claim-participation",who,{source:"match",id:hm.id})).json()).credited).toBe(0);}
  const dc=await(await call("POST","challenges","alice",{game:"diagram",topic:"Plants",age:12,room_id:room.id})).json();
  const dm=await(await call("POST","matches","alice",{challenge_id:dc.id,mode:"friends"})).json();
  await call("POST",`matches/${dm.id}/start`);await advance(5000);
  const board=await(await call("GET",`matches/${dm.id}`)).json();expect(board.view.board.answers).toBeUndefined();
  expect(await(await call("GET",`matches/${dm.id}/diagram/view`)).text()).toContain("n1: ?");
  expect((await call("GET",`matches/${dm.id}/diagram/view`,"carol")).status).toBe(404);
  expect((await call("PUT",`matches/${dm.id}/placements`,"alice",{placements:{n1:0,n2:1}})).status).toBe(200);
  expect((await(await call("POST",`matches/${dm.id}/finish`)).json()).perfect).toBe(true);
  expect((await call("GET",`matches/${dm.id}/results`)).status).toBe(409);
  await advance(1000);await call("PUT",`matches/${dm.id}/placements`,"bob",{placements:{n1:0,n2:1}});await call("POST",`matches/${dm.id}/finish`,"bob");
  expect((await(await call("GET",`matches/${dm.id}/results`)).json()).ranking[0].winner).toBe(true);
  for(const who of ["alice","bob"]){expect((await(await call("POST","me/coins/claim-participation",who,{source:"match",id:dm.id})).json()).credited).toBe(20);expect((await(await call("GET","me/wallet",who)).json()).coins).toBe(280);}
 });
});
