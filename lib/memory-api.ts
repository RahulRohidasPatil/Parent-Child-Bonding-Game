import { http } from "./learn-api";
import { EMPTY_CHAT, type ChatFile, type Conversation } from "./learn-chat";
import { getAccountKey, getState, setState, updateChat, deleteChat } from "./store";

type Summary = { id: string; title: string; updated_at: string; message_count: number; material_name: string | null };
type Detail = Summary & { material_id: string | null; messages: { seq: number; role: "user" | "assistant"; content: string; created_at: string; used_pdf: boolean; pages: number[] }[] };
const pending = new Map<string, Promise<string>>();
export async function ensureSavedChat(localId: string, material: ChatFile | null): Promise<string> {
  const chat = getState().chats.find((c) => c.id === localId);
  if (chat?.serverId && (chat.serverMaterialId ?? null) === (material?.id ?? null)) return chat.serverId;
  const key = `${getAccountKey()}/${localId}/${material?.id ?? ""}`;
  let request = pending.get(key);
  if (!request) {
    const account = getAccountKey();
    request = http.post<Detail>("memory/conversations", { title: (chat?.title ?? "New chat").slice(0, 80), ...(material ? { material_id: material.id } : {}) }).then((r) => {
      if (getAccountKey() !== account) throw new Error("The active account changed.");
      updateChat(localId, (c) => ({ ...c, serverId: r.id, serverMaterialId: material?.id ?? null }));
      return r.id;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}
export async function refreshChatHistory() {
  const account = getAccountKey();
  const result = await http.get<{ items: Summary[] }>("memory/conversations?limit=100");
  if (getAccountKey() !== account) return;
  setState((s) => ({ chats: [
    ...result.items.map((r): Conversation => {
      const previous = s.chats.find((c) => c.serverId === r.id || c.id === r.id);
      return { ...EMPTY_CHAT, ...previous, id: previous?.id ?? r.id, serverId: r.id, title: r.title, updatedAt: Date.parse(r.updated_at), messageCount: r.message_count };
    }),
    ...s.chats.filter((c) => !c.serverId),
  ].sort((a, b) => b.updatedAt - a.updatedAt) }));
}
export async function openSavedChat(id: string) {
  const account = getAccountKey();
  const chat = getState().chats.find((c) => c.id === id);
  if (!chat?.serverId) return;
  const r = await http.get<Detail>(`memory/conversations/${encodeURIComponent(chat.serverId)}`);
  if (getAccountKey() !== account) return;
  updateChat(id, (c) => ({ ...c, serverMaterialId: r.material_id, material: r.material_id ? c.material ?? { id: r.material_id, name: r.material_name ?? "Notes", kind: "pdf", pages: 0 } : null,
    messages: r.messages.map((m) => ({ id: `${r.id}-${m.seq}`, role: m.role, text: m.content, at: Date.parse(m.created_at), usedFile: m.used_pdf, pages: m.pages })),
  }));
}
export async function deleteSavedChat(id: string) {
  const chat = getState().chats.find((c) => c.id === id);
  if (chat?.serverId) await http.del(`memory/conversations/${encodeURIComponent(chat.serverId)}`);
  deleteChat(id);
}

export async function renameSavedChat(id: string, title: string) {
  const chat = getState().chats.find((c) => c.id === id);
  if (chat?.serverId) await http.patch(`memory/conversations/${encodeURIComponent(chat.serverId)}`, { title });
  setState((s) => ({ chats: s.chats.map((c) => c.id === id ? { ...c, title } : c) }));
}
