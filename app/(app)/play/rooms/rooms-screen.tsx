"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Page } from "@/components/qn/app-shell";
import { Card, Notice, PageHeader } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { gamesApi, type Game, type Mode, type Room } from "@/lib/games-api";
import { homeApi } from "@/lib/home-api";
import { http, ApiError } from "@/lib/learn-api";
import { useUser } from "@/lib/use-user";

const field = "rounded-xl border border-line bg-card p-3 font-bold";
export function RoomsScreen() {
  const router = useRouter(); const params = useSearchParams(); const { user } = useUser();
  const [room, setRoom] = useState<Room | null>(null); const [me, setMe] = useState("");
  const [code, setCode] = useState(""); const [game, setGame] = useState<Game>((["mcq","heads_up","diagram"].includes(params.get("game") ?? "") ? params.get("game") : "mcq") as Game);
  const [mode, setMode] = useState<Mode>((["solo","friends","parent_child","duo"].includes(params.get("mode") ?? "") ? params.get("mode") : "friends") as Mode); const [topic, setTopic] = useState(""); const [age, setAge] = useState(12);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [friends, setFriends] = useState<{ player_id: string; display_name: string }[]>([]);
  const [invites, setInvites] = useState<{ id: string; sender_id: string; game: Game; mode: Mode }[]>([]);
  const [teams, setTeams] = useState<Record<string, number>>({});
  useEffect(() => { homeApi.mine().then((h) => setMe(h.owner.id)).catch((e) => setError(e.message)); homeApi.friends().then((r) => setFriends(r.items.filter((f) => f.status === "accepted"))).catch(() => undefined); }, []);
  useEffect(() => {
    const id = params.get("room");
    if (id) void gamesApi.room(id).then(setRoom).catch((e) => setError(e.message));
  }, [params]);
  useEffect(() => {
    const load = () => http.get<{ items: typeof invites }>("me/game-invites?status=pending").then((r) => setInvites(r.items)).catch(() => undefined);
    void load(); const timer = setInterval(load, 5000); return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!room) return;
    const id = room.id;
    const load = async () => { try { setRoom(await gamesApi.room(id)); const match = await gamesApi.current(id).catch((e) => { if (e instanceof ApiError && e.status === 404) return null; throw e; }); if (match && match.phase !== "finished") router.replace(`/play/match/${match.id}`); } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t update the room."); } };
    const timer = setInterval(() => { void load(); }, 2000); return () => clearInterval(timer);
  }, [room?.id, router]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(action: () => Promise<void>) { setBusy(true); setError(null); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); } }
  async function start() {
    await run(async () => {
      const challenge = await gamesApi.challenge({ game, topic: topic.trim(), age, ...(room && mode !== "solo" ? { room_id: room.id } : {}), ...(game === "mcq" ? { count: 5, seconds: 30 } : game === "heads_up" ? { count: 12, seconds: 60 } : { seconds: 120 }) });
      const groups = room && mode === "duo" ? [0,1].map((team) => room.members.filter((m,i) => (teams[m.user_id] ?? (i < 2 ? 0 : 1)) === team).map((m) => m.user_id)) : undefined;
      const match = await gamesApi.createMatch(challenge.id, mode, groups); await gamesApi.start(match.id); router.push(`/play/match/${match.id}`);
    });
  }
  const mine = room?.members.find((m) => m.user_id === me); const host = room?.host_id === me;
  return <Page><PageHeader title="Game room" sub="Play together on your own devices" back={{ href: "/play", label: "Back to Play" }} />
    {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
    {invites.length > 0 && <Card className="flex flex-col gap-3 p-4"><h2 className="font-black">Game invitations</h2>{invites.map((i) => <div key={i.id} className="flex flex-wrap items-center gap-2"><span className="flex-1 font-bold">{i.sender_id === me ? "Your invitation" : friends.find((f) => f.player_id === i.sender_id)?.display_name ?? "A friend"} · {i.game}</span>{i.sender_id !== me && <Button variant="brand" disabled={busy} onClick={() => run(async () => { const result = await http.post<{ room: Room }>(`me/game-invites/${i.id}/accept`, {}); setRoom(result.room); setGame(i.game); setMode(i.mode); setInvites((all) => all.filter((x) => x.id !== i.id)); })}>Accept</Button>}<Button variant="soft" disabled={busy} onClick={() => run(async () => { await http.post(`me/game-invites/${i.id}/${i.sender_id === me ? "cancel" : "decline"}`, {}); setInvites((all) => all.filter((x) => x.id !== i.id)); })}>{i.sender_id === me ? "Cancel" : "Decline"}</Button></div>)}</Card>}
    {!room ? <Card className="flex flex-col gap-3 p-5">
      <label className="font-bold">Game <select className={`${field} ml-2`} value={game} onChange={(e) => { const next = e.target.value as Game; setGame(next); if ((next === "heads_up" && mode === "solo") || (next === "diagram" && mode === "duo")) setMode("friends"); }}><option value="mcq">Quiz race</option><option value="heads_up">Forbidden clues / heads-up</option><option value="diagram">Diagram race</option></select></label>
      <label className="font-bold">Players <select className={`${field} ml-2`} value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option value="friends">Friends</option><option value="parent_child">Parent + child</option><option value="duo" disabled={game === "diagram"}>Two teams of two</option><option value="solo" disabled={game === "heads_up"}>Solo</option></select></label>
      <label className="font-bold">Topic <input className={`${field} w-full`} value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} placeholder="What are you studying?" /></label>
      <label className="font-bold">Youngest player’s age <input type="number" min={5} max={18} className={`${field} w-24`} value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
      <Button variant="brand" size="cta" disabled={busy || !user || (mode === "solo" && !topic.trim())} onClick={() => mode === "solo" ? start() : run(async () => setRoom(await gamesApi.createRoom(user?.name ?? "Player", mode === "parent_child" ? 2 : mode === "duo" ? 4 : 8)))}>{busy ? "Preparing…" : mode === "solo" ? "Start solo game" : "Create room"}</Button>
      <hr className="border-line" /><label className="font-bold">Join with a room code <input className={`${field} w-full uppercase`} maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="8-character code" /></label>
      <Button variant="soft" size="cta" disabled={busy || code.trim().length !== 8} onClick={() => run(async () => setRoom(await gamesApi.join(code, user?.name ?? "Player")))}>Join room</Button>
    </Card> : <>
      <Card className="flex flex-col gap-3 p-5"><h2 className="text-xl font-black">Room {room.code}</h2><p>Share this code with your friends.</p>
        {room.members.map((m,i) => <div key={m.user_id} className="flex items-center gap-3"><span className="flex-1 font-bold">{m.display_name} {m.ready ? "✓ Ready" : "· Not ready"}</span>{host && mode === "duo" && <select className={field} value={teams[m.user_id] ?? (i < 2 ? 0 : 1)} onChange={(e) => setTeams((t) => ({ ...t, [m.user_id]: Number(e.target.value) }))}><option value={0}>Team 1</option><option value={1}>Team 2</option></select>}</div>)}
        <Button variant="soft" size="cta" disabled={busy} onClick={() => run(async () => setRoom(await gamesApi.command(room, "ready", !mine?.ready)))}>{mine?.ready ? "Not ready" : "I’m ready"}</Button>
        {host && <><input aria-label="Topic" className={field} value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} placeholder="Topic for the game" /><Button variant="brand" size="cta" disabled={busy || !topic.trim() || room.members.length < 2 || room.members.some((m) => !m.ready)} onClick={start}>{busy ? "Writing the game…" : "Create and start game"}</Button></>}
        <Button variant="ghost" size="pill" disabled={busy} onClick={() => run(async () => { await gamesApi.command(room, "leave"); setRoom(null); })}>Leave room</Button>
      </Card>
      {host && <Card className="flex flex-col gap-2 p-4"><h2 className="font-black">Invite a friend</h2>{friends.filter((f) => !room.members.some((m) => m.user_id === f.player_id)).map((f) => <Button key={f.player_id} variant="soft" disabled={busy} onClick={() => run(async () => { await http.postKey("me/game-invites", { friend_id: f.player_id, room_id: room.id, game, mode }, crypto.randomUUID()); })}>{f.display_name}</Button>)}</Card>}
      {!host && <p className="text-center font-bold">Waiting for the host to start. You’ll enter the match automatically.</p>}
    </>}
  </Page>;
}
