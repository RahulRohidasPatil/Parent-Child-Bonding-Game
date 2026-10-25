import { http } from "./learn-api";
import { getAccountKey, getState, setState, type RecentItem } from "./store";

type Resource = { id: string; title?: string; name?: string; lesson_id?: string; status?: string };
async function list(kind: string): Promise<Resource[]> {
  const items: Resource[] = [];
  let after: string | null = "";
  do {
    const page: { items: Resource[]; next_cursor: string | null } = await http.get(`resources/${kind}?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`);
    items.push(...page.items); after = page.next_cursor;
  } while (after);
  return items;
}
export async function refreshLibrary() {
  const account = getAccountKey();
  const kinds = ["lessons", "quizzes", "decks", "materials"] as const;
  const pages = await Promise.all(kinds.map(list));
  if (getAccountKey() !== account) return;
  const existing = getState().recent;
  const kindMap = { lessons: "lesson", quizzes: "quiz", decks: "deck", materials: "material" } as const;
  const saved: RecentItem[] = pages.flatMap((items, index) => items.map((item) => {
    const kind = kindMap[kinds[index]];
    const old = existing.find((r) => r.id === item.id && r.kind === kind);
    return { ...old, kind, id: item.id, title: item.title ?? item.name ?? old?.title ?? "Saved learning", lessonId: item.lesson_id, at: old?.at ?? 0 };
  }));
  setState({ recent: [...saved, ...existing.filter((r) => r.kind === "duel")].sort((a, b) => b.at - a.at) });
}
