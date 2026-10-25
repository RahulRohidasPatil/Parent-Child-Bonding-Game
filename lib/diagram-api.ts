import { http } from "./learn-api";
export type Race = { id:string;room_id:string;version:number;status:"waiting"|"countdown"|"running"|"finished"|"expired"|"cancelled";question:string;started_at:number|null;deadline_at:number|null;server_now:number;my_player_id:string;players:{id:string;display_name:string;placed:number;completed:boolean;forfeited:boolean}[] };
export type Board = { id:string;puzzle_svg:string;view_box:string;slots:{id:string;x:number;y:number;width:number;height:number}[];cards:{id:string;text:string}[];placements:Record<string,string>;version:number;started_at:number;deadline_at:number;server_now:number };
export type RaceResults = { status:string;players:{id:string;display_name:string;completed:boolean;elapsed_ms:number|null;rank:number|null;forfeited:boolean;submissions:number}[];winner_ids:string[];reference_svg?:string;solution?:{slot_id:string;text:string}[] };
const key=()=>crypto.randomUUID();
export const diagramApi={
  template:(lesson_id:string,visual_id:string)=>http.postKey<{id:string}>("diagram-assembly/templates",{lesson_id,visual_id},`template-${lesson_id}-${visual_id}`.slice(0,128)),
  create:(template_id:string,room_id:string,expected_room_version:number)=>http.postKey<{id:string}>("diagram-assembly/races",{template_id,room_id,expected_room_version},key()),
  current:(room:string)=>http.get<Race>(`diagram-assembly/rooms/${room}/race`),
  race:(id:string)=>http.get<Race>(`diagram-assembly/races/${id}`),
  management:(room:string)=>http.get<{race_id:string;version:number}>(`diagram-assembly/rooms/${room}/management`),
  study:(id:string)=>http.get<{reference_svg:string;view_box:string}>(`diagram-assembly/races/${id}/study`),
  start:(race:Race)=>http.postKey(`diagram-assembly/races/${race.id}/start`,{expected_version:race.version},`start-${race.id}-${race.version}`),
  board:(id:string)=>http.get<Board>(`diagram-assembly/races/${id}/board`),
  place:(id:string,board:Board,placements:Record<string,string>)=>fetch(`/api/diagram-assembly/races/${id}/placements`,{method:"PUT",headers:{"Content-Type":"application/json","Idempotency-Key":key()},body:JSON.stringify({expected_version:board.version,placements})}).then(async(r)=>{if(!r.ok){const b=await r.json();throw new Error(b.detail??"Couldn’t save the labels.");}return r.json();}),
  finish:(id:string,version:number)=>http.postKey<{completed:boolean;correct_count:number;incorrect_slot_ids:string[]}>(`diagram-assembly/races/${id}/finish`,{expected_version:version},`finish-${id}-${version}`),
  forfeit:(id:string,version:number)=>http.postKey(`diagram-assembly/races/${id}/forfeit`,{expected_version:version},`forfeit-${id}-${version}`),
  cancel:(race:Race)=>http.postKey(`diagram-assembly/races/${race.id}/cancel`,{expected_version:race.version},`cancel-${race.id}-${race.version}`),
  results:(id:string)=>http.get<RaceResults>(`diagram-assembly/races/${id}/results`),
  review:(id:string)=>http.get<RaceResults>(`diagram-assembly/races/${id}/review`),
};
export const svgDocument=(svg:string)=>`<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;}svg{width:100%;height:100%;}</style></head><body>${svg}</body></html>`;
