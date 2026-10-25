"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  FileSearch,
  FileText,
  History as HistoryIcon,
  Image as ImageIcon,
  Layers,
  ListChecks,
  MessagesSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Sparkles,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { useLearnerAge } from "@/components/qn/learn-bits";
import { Sheet } from "@/components/qn/sheet";
import { Card, Notice, PageHeader, Spinner } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { ApiError, learnApi } from "@/lib/learn-api";
import {
  EMPTY_CHAT,
  MESSAGE_MAX,
  PLAN_FILE_PROMPT,
  PLAN_QUESTION_MAX,
  TEACH_FILE_PROMPT,
  asksForWholeFile,
  historyFor,
  lessonTopicFor,
  type ChatFile,
  type ChatMessage,
  type ChatModes,
  type Conversation,
} from "@/lib/learn-chat";
import { ensureChatId, getAccountKey, getState, markStudiedToday, openChat, remember, savePlan, updateChat, useQN } from "@/lib/store";
import { ensureSavedChat, refreshChatHistory, openSavedChat, deleteSavedChat, renameSavedChat } from "@/lib/memory-api";
import { parseStudyPlan, planMessage, type StudyPlan } from "@/lib/study-plan";
import { cn } from "@/lib/utils";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const isPdf = (f: File) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
const isImage = (f: File) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
const MAX_FILE = 25 * 1024 * 1024;
const NO_MODES: ChatModes = { pdfOnly: false, plan: false };

const SUGGESTIONS = ["How do volcanoes erupt?", "Explain fractions with pizza", "Why is the sky blue?"];

const uid = () => crypto.randomUUID();
const now = () => Date.now();
const stem = (name: string) => name.replace(/\.[^.]+$/, "");
// Models sometimes answer in markdown; show it as plain text.
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");
const patch = (chatId: string, msgId: string, change: Partial<ChatMessage>) =>
  updateChat(chatId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...change } : m)) }));
const append = (chatId: string, ...add: ChatMessage[]) => updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, ...add] }));

type Busy = { kind: "upload" | "answer" | "plan"; chatId: string };
const BUSY_TEXT: Record<Busy["kind"], string> = {
  upload: "Reading your file…",
  answer: "Thinking…",
  plan: "Building your study plan…",
};

/** Ask anything, attach notes, or make a study plan, with every chat kept in the history (POST /api/chat). */
export function LearnChat() {
  const router = useRouter();
  useEffect(() => { void refreshChatHistory().catch(() => undefined); }, []);
  const id = useId();
  const chatId = useQN((s) => s.chatId);
  const chats = useQN((s) => s.chats);
  const plans = useQN((s) => s.plans);
  const chat = chats.find((c) => c.id === chatId) ?? EMPTY_CHAT;
  const { age, loading: ageLoading } = useLearnerAge();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [modes, setModes] = useState<ChatModes>(NO_MODES);
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState(false);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [games, setGames] = useState<Record<string, "quiz" | "deck">>({});
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Cache Components keeps this page alive while hidden; a game that finishes then shouldn't navigate.
  const shown = useRef(false);
  useLayoutEffect(() => {
    shown.current = true;
    return () => {
      shown.current = false;
      setMenu(false);
      setHistory(false);
    };
  }, []);

  const messages = chat.messages;
  const maxLen = modes.plan ? PLAN_QUESTION_MAX : MESSAGE_MAX;
  const hasFile = !!file || !!chat.material;
  const busyHere = busy && busy.chatId === chatId ? busy.kind : null;
  const last = messages[messages.length - 1];

  // Keep the newest thing in view above the chat box: the bottom while asking, the start of a new answer.
  useEffect(() => {
    if (last?.role === "assistant" && !busyHere) {
      document.getElementById(`msg-${last.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  }, [last?.id, last?.role, busyHere, chatId]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  function attach(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    if (list.length > 1) return setError("Attach one file at a time: a PDF or a photo.");
    const f = list[0];
    if (!isPdf(f) && !isImage(f)) return setError(`“${f.name}” can’t be read. Use a PDF, or a JPG, PNG or WebP photo.`);
    if (f.size > MAX_FILE) return setError(`“${f.name}” is over 25 MB.`);
    setFile(f);
    box.current?.focus();
  }

  function clearFile() {
    setFile(null);
    if (pick.current) pick.current.value = "";
  }

  function resetComposer() {
    setModes(NO_MODES);
    clearFile();
    setText("");
    setError(null);
  }

  function newChat() {
    openChat(null);
    resetComposer();
  }

  /** `again` resends an earlier question (Try again), with its own text, modes and hidden prompt. */
  async function send(typed: string, sendModes: ChatModes, sendFile: File | null, again?: ChatMessage) {
    if (busy) return;
    const account = getAccountKey();
    const t = again ? again.text : typed.trim();
    if (!t && !sendFile && !again) return;
    if (!age) return setError("We don’t know your age yet, so we can’t pitch answers right. Add it once in Settings.");
    const cid = ensureChatId();
    let material: ChatFile | null = getState().chats.find((c) => c.id === cid)?.material ?? null;
    const aboutFile = !!sendFile || !!material;
    if (sendModes.pdfOnly && !aboutFile) return setError("Attach a PDF or photo first, so there’s something to answer from.");

    // Only a file, or "explain this": ask for the ideas in the file, and keep that prompt out of the bubble.
    const hidden = again ? !!again.hidden : !t;
    const whole = aboutFile && (hidden || asksForWholeFile(t));
    const question = whole ? (sendModes.plan ? PLAN_FILE_PROMPT : TEACH_FILE_PROMPT) : t;
    const limit = sendModes.plan ? PLAN_QUESTION_MAX : MESSAGE_MAX;
    if (question.length > limit) return setError(`That’s ${question.length} characters. ${sendModes.plan ? "Study plans" : "Questions"} have room for ${limit}.`);

    setError(null);
    setText("");
    clearFile();
    const fileName = sendFile?.name ?? again?.file?.name ?? material?.name;
    const ask = hidden ? stem(fileName ?? "My notes") : t;
    const mine: ChatMessage = {
      id: uid(),
      role: "user",
      text: hidden ? "" : t,
      at: now(),
      modes: sendModes,
      ...(question !== t ? { sent: question } : {}),
      ...(hidden ? { hidden: true } : {}),
      ...(sendFile ? { file: { name: sendFile.name, kind: isPdf(sendFile) ? ("pdf" as const) : ("photos" as const) } } : again?.file ? { file: again.file } : {}),
    };
    const past = historyFor(getState().chats.find((c) => c.id === cid)?.messages ?? []);
    append(cid, mine);

    try {
      if (sendFile && !isImage(sendFile)) {
        setBusy({ kind: "upload", chatId: cid });
        const m = await learnApi.uploadMaterial([sendFile]);
        if (getAccountKey() !== account) return;
        remember({ kind: "material", id: m.id, title: m.name, detail: `${m.page_count} page${m.page_count === 1 ? "" : "s"}` });
        // The chat only reads uploads whose extracted text is confirmed.
        await learnApi.ensureConfirmed(m.id);
        if (getAccountKey() !== account) return;
        material = { id: m.id, name: m.name, kind: m.kind, pages: m.page_count };
        const attached = material;
        updateChat(cid, (c) => ({ ...c, material: attached }));
      }
    } catch (e) {
      // Nothing was asked yet: put the question and file back so it can be sent again.
      updateChat(cid, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== mine.id) }));
      setText(typed);
      setFile(sendFile);
      setError(e instanceof ApiError ? e.message : "Couldn’t read that file. Try again.");
      setBusy(null);
      return;
    }

    try {
      setBusy({ kind: sendModes.plan ? "plan" : "answer", chatId: cid });
      const conversation_id = await ensureSavedChat(cid, material);
      const out = sendFile && isImage(sendFile)
        ? await learnApi.imageChat(sendFile, sendModes.plan ? planMessage(question) : question, age, conversation_id)
        : await learnApi.chat({
        conversation_id,
        message: sendModes.plan ? planMessage(question) : question,
        age,
        history: past,
        ...(material ? { material_id: material.id, mode: sendModes.pdfOnly ? ("pdf_only" as const) : ("auto" as const) } : {}),
      });
      if (getAccountKey() !== account) return;
      const reply: ChatMessage = { id: uid(), role: "assistant", text: out.answer, at: now(), ask, material, usedFile: out.used_pdf, pages: out.pages, label: out.label };
      if (sendModes.plan) {
        reply.planId = uid();
        savePlan({
          id: reply.planId,
          ...parseStudyPlan(out.answer, ask),
          prompt: ask,
          source: out.used_pdf ? out.label : null,
          // Only a plan made from the file studies from it; otherwise its lessons would be limited to unrelated pages.
          material: material && out.used_pdf ? { id: material.id, pages: material.pages } : null,
          at: now(),
        });
      }
      markStudiedToday();
      append(cid, reply);
    } catch (e) {
      if (getAccountKey() !== account) return;
      const msg = e instanceof ApiError ? e.message : "Couldn’t answer that. Try again.";
      append(cid, { id: uid(), role: "assistant", text: msg, at: now(), ask, error: true });
    } finally {
      setBusy(null);
    }
  }

  function retry(failed: ChatMessage) {
    if (!chatId) return;
    const i = messages.findIndex((m) => m.id === failed.id);
    const question = messages[i - 1];
    if (!question || question.role !== "user") return;
    updateChat(chatId, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== failed.id && m.id !== question.id) }));
    send("", question.modes ?? NO_MODES, null, question);
  }

  async function play(msg: ChatMessage, kind: "quiz" | "deck") {
    const ready = kind === "quiz" ? msg.quizId : msg.deckId;
    if (ready) return router.push(kind === "quiz" ? `/play/solo/quiz/${ready}` : `/play/solo/flashcards/${ready}`);
    if (!age) return setError("We don’t know your age yet. Add it once in Settings.");
    if (!chatId || games[msg.id]) return;
    const cid = chatId;
    setError(null);
    setGames((g) => ({ ...g, [msg.id]: kind }));
    try {
      // Lessons live in the server's memory, so a saved one can be gone after a restart.
      let lessonId = msg.lessonId;
      if (lessonId && !(await learnApi.getLesson(lessonId).then(() => true, () => false))) lessonId = undefined;
      if (!lessonId) {
        const plan = msg.planId ? plans.find((p) => p.id === msg.planId) : undefined;
        const { topic, materialId } = await lessonTopicFor(msg, plan);
        let lesson;
        try {
          if (materialId) await learnApi.ensureConfirmed(materialId);
          lesson = await learnApi.createLesson({ topic, age, ...(materialId ? { material_id: materialId } : {}) });
        } catch (e) {
          // The file doesn't cover it (or is gone after a restart): build the lesson from general knowledge.
          if (!materialId || !(e instanceof ApiError) || ![404, 409, 422].includes(e.status)) throw e;
          lesson = await learnApi.createLesson({ topic: (plan?.title ?? msg.ask ?? topic).slice(0, 200), age });
        }
        lessonId = lesson.id;
        patch(cid, msg.id, { lessonId });
      }
      if (kind === "quiz") {
        const q = await learnApi.createQuiz(lessonId);
        remember({ kind: "quiz", id: q.id, title: q.title, lessonId, detail: `${q.questions.length} questions` });
        patch(cid, msg.id, { quizId: q.id });
        if (shown.current) router.push(`/play/solo/quiz/${q.id}`);
      } else {
        const d = await learnApi.createDeck(lessonId);
        remember({ kind: "deck", id: d.id, title: d.title, lessonId, detail: `${d.cards.length} cards` });
        patch(cid, msg.id, { deckId: d.id });
        if (shown.current) router.push(`/play/solo/flashcards/${d.id}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Couldn’t make the ${kind === "quiz" ? "quiz" : "flashcards"}. Try again.`);
    } finally {
      setGames((g) => {
        const next = { ...g };
        delete next[msg.id];
        return next;
      });
    }
  }

  const toggle = (k: keyof ChatModes) => {
    setModes((m) => ({ ...m, [k]: !m[k] }));
    setMenu(false);
    box.current?.focus();
  };

  return (
    <Page className="max-w-[880px] flex-1 gap-4 pb-4 md:gap-4">
      <PageHeader
        title="Chat"
        sub="Ask a question, attach your notes, or make a study plan."
        right={
          <div className="flex gap-2">
            {chats.length > 0 && (
              <Button variant="soft" size="pill" onClick={() => setHistory(true)} aria-label={`Chat history, ${chats.length} chats`}>
                <HistoryIcon /> <span className="hidden sm:inline">History</span>
              </Button>
            )}
            {messages.length > 0 && (
              <Button variant="soft" size="pill" onClick={newChat} aria-label="New chat">
                <SquarePen /> <span className="hidden sm:inline">New chat</span>
              </Button>
            )}
          </div>
        }
      />

      {chat.material && chatId && (
        <div className="flex items-center gap-2 self-start rounded-full bg-sky-soft py-1.5 pr-1.5 pl-3 text-[13px] font-extrabold text-sky-ink">
          <FileText className="size-4" />
          <span className="max-w-[48vw] truncate">
            Using {chat.material.name} · {chat.material.pages} page{chat.material.pages === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => updateChat(chatId, (c) => ({ ...c, material: null }))}
            aria-label={`Stop using ${chat.material.name}`}
            className="flex size-6 items-center justify-center rounded-full hover:bg-white/60"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ---------- conversation ---------- */}
      <section aria-label="Conversation" className="flex flex-1 flex-col gap-4" aria-live="polite">
        {messages.length === 0 && !busyHere ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand text-white">
              <Sparkles className="size-7" />
            </span>
            <span className="text-[22px] font-black text-balance">What do you want to learn today?</span>
            <span className="max-w-[46ch] text-[15px] font-bold text-muted-foreground">
              Tap <Plus className="inline size-4 align-[-2px]" /> to attach a PDF or photo, answer only from it, or turn it into a study plan.
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s, NO_MODES, null)}
                  className="rounded-full border border-line bg-card px-3.5 py-2 text-sm font-extrabold hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} m={m} />
            ) : (
              <AnswerBubble
                key={m.id}
                m={m}
                plan={m.planId ? plans.find((p) => p.id === m.planId) : undefined}
                making={games[m.id]}
                onPlay={(k) => play(m, k)}
                onRetry={() => retry(m)}
                busy={!!busy}
              />
            ),
          )
        )}
        {busyHere && (
          <div className="flex items-start gap-2.5">
            <BotFace />
            <span className="flex items-center gap-2 rounded-[18px_18px_18px_4px] bg-card px-3.5 py-2.5 text-[15px] font-extrabold text-muted-foreground" role="status">
              <Spinner className="text-brand" /> {BUSY_TEXT[busyHere]}
            </span>
          </div>
        )}
      </section>

      {/* ---------- composer: stays at the bottom, above the phone tab bar ---------- */}
      <div className="sticky bottom-[92px] z-30 flex flex-col gap-2 md:bottom-4">
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
        {!ageLoading && !age && (
          <Notice tone="warn">
            We don’t know your age yet.{" "}
            <Link href="/settings" className="font-black underline">
              Add it once in Settings
            </Link>{" "}
            and every answer will match your level.
          </Notice>
        )}
        <Card
          className={cn("flex flex-col gap-2 p-2.5 shadow-[0_6px_24px_rgba(20,40,32,.12)]", drag && "border-brand bg-brand-soft")}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            attach(e.dataTransfer.files);
          }}
        >
          {(file || modes.pdfOnly || modes.plan) && (
            <div className="flex flex-wrap gap-2 px-1 pt-1">
              {file && <Chip icon={isPdf(file) ? <FileText /> : <ImageIcon />} label={file.name} tone="file" onRemove={clearFile} removeLabel={`Remove ${file.name}`} />}
              {modes.pdfOnly && <Chip icon={<FileSearch />} label="Answer my PDF" onRemove={() => toggle("pdfOnly")} removeLabel="Turn off Answer my PDF" />}
              {modes.plan && <Chip icon={<CalendarDays />} label="Study plan" onRemove={() => toggle("plan")} removeLabel="Turn off Study plan" />}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(text, modes, file);
            }}
          >
            <div ref={menuRef} className="relative">
              <Button
                type="button"
                variant="soft"
                size="icon-lg"
                className="size-11 rounded-full"
                aria-label="Attach a file or choose a mode"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-controls={`${id}-menu`}
                onClick={() => setMenu(!menu)}
              >
                <Plus className={cn("transition-transform motion-reduce:transition-none", menu && "rotate-45")} />
              </Button>
              {menu && (
                <div id={`${id}-menu`} role="menu" className="absolute bottom-full left-0 mb-2 flex w-[280px] flex-col gap-1 rounded-2xl border border-line bg-card p-1.5 shadow-[0_10px_30px_rgba(20,40,32,.18)]">
                  <MenuItem
                    icon={<Paperclip />}
                    title="Attach PDF or photo"
                    sub="One file, up to 25 MB"
                    onClick={() => {
                      setMenu(false);
                      pick.current?.click();
                    }}
                  />
                  <MenuItem
                    icon={<FileSearch />}
                    title="Answer my PDF"
                    sub={hasFile ? "Answers only from your file" : "Answers only from your file (attach one too)"}
                    checked={modes.pdfOnly}
                    onClick={() => toggle("pdfOnly")}
                  />
                  <MenuItem icon={<CalendarDays />} title="Prepare study plan" sub="Main topic split into subtopics" checked={modes.plan} onClick={() => toggle("plan")} />
                </div>
              )}
            </div>
            <label htmlFor={`${id}-ask`} className="sr-only">
              Your question
            </label>
            <textarea
              id={`${id}-ask`}
              ref={box}
              rows={1}
              maxLength={maxLen}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text, modes, file);
                }
              }}
              placeholder={file ? "Ask about your file, or just send it" : modes.plan ? "What should the study plan cover?" : "Ask anything…"}
              className="max-h-40 min-h-11 w-full min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-base leading-snug font-bold text-foreground outline-none [field-sizing:content] placeholder:font-semibold placeholder:text-[#7b8994]"
            />
            <Button type="submit" variant="brand" size="icon-lg" className="size-11 rounded-full" disabled={!!busy || (!text.trim() && !file)} aria-label="Send">
              {busy ? <Spinner /> : <ArrowUp strokeWidth={2.8} />}
            </Button>
          </form>
          {text.length > maxLen * 0.8 && (
            <span className="px-2 text-right text-xs font-bold text-muted-foreground" aria-live="polite">
              {text.length}/{maxLen}
            </span>
          )}
          <input ref={pick} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => attach(e.target.files)} />
        </Card>
      </div>

      <Sheet open={history} onClose={() => setHistory(false)} title="Chat history" sub="Pick a chat to carry on where you left off.">
        <ChatHistory
          chats={chats}
          activeId={chatId}
          onOpen={(c) => {
            void openSavedChat(c).then(() => openChat(c)).catch((e) => setError(e.message));
            resetComposer();
            setHistory(false);
          }}
          onNew={() => {
            newChat();
            setHistory(false);
          }}
        />
      </Sheet>
    </Page>
  );
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const when = (at: number) => {
  const d = new Date(at);
  return d.toDateString() === new Date().toDateString() ? `Today, ${timeFmt.format(d)}` : dayFmt.format(d);
};

function ChatHistory({ chats, activeId, onOpen, onNew }: { chats: Conversation[]; activeId: string | null; onOpen: (id: string) => void; onNew: () => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button variant="brand" size="pill" className="self-start" onClick={onNew}>
        <SquarePen /> New chat
      </Button>
      <ul className="flex flex-col gap-1.5">
        {chats.map((c) => {
          const n = c.messageCount !== undefined ? Math.ceil(c.messageCount / 2) : c.messages.filter((m) => m.role === "user").length;
          const on = c.id === activeId;
          return (
            <li key={c.id} className={cn("flex items-center gap-2 rounded-2xl border px-2 py-1.5", on ? "border-brand bg-brand-soft" : "border-line bg-background")}>
              <button type="button" onClick={() => onOpen(c.id)} aria-current={on ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-2.5 px-1 py-1 text-left">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-brand">
                  {c.material ? <FileText className="size-[18px]" /> : <MessagesSquare className="size-[18px]" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-[15px] font-black">{c.title}</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {when(c.updatedAt)} · {n} question{n === 1 ? "" : "s"}
                  </span>
                </span>
              </button>
              <Button variant="ghost" size="pill" onClick={() => { const title = window.prompt("Chat title", c.title); if (title?.trim()) void renameSavedChat(c.id, title.trim().slice(0, 80)); }}>Rename</Button>
              {confirm === c.id ? (
                <span className="flex shrink-0 items-center gap-1">
                  <Button variant="soft" size="pill" className="h-8 px-3 text-destructive" onClick={() => { void deleteSavedChat(c.id).catch(() => setConfirm(null)); }}>
                    Delete
                  </Button>
                  <Button variant="ghost" size="pill" className="h-8 px-2.5" onClick={() => setConfirm(null)}>
                    Keep
                  </Button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm(c.id)}
                  aria-label={`Delete “${c.title}”`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BotFace() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden="true">
      <Sparkles className="size-4" />
    </span>
  );
}

function Chip({ icon, label, tone, onRemove, removeLabel }: { icon: React.ReactNode; label: string; tone?: "file"; onRemove: () => void; removeLabel: string }) {
  return (
    <span
      className={cn(
        "flex h-8 max-w-full items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-[13px] font-black [&_svg]:size-4",
        tone === "file" ? "border-line bg-background text-foreground" : "border-brand bg-brand-soft text-brand-dark",
      )}
    >
      {icon}
      <span className="max-w-[220px] truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="flex size-6 items-center justify-center rounded-full hover:bg-black/5">
        <X className="size-3.5" />
      </button>
    </span>
  );
}

function MenuItem({ icon, title, sub, checked, onClick }: { icon: React.ReactNode; title: string; sub: string; checked?: boolean; onClick: () => void }) {
  const toggles = checked !== undefined;
  return (
    <button
      type="button"
      role={toggles ? "menuitemcheckbox" : "menuitem"}
      aria-checked={toggles ? checked : undefined}
      onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-muted", checked && "bg-brand-soft hover:bg-brand-soft")}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px]", checked ? "bg-brand text-white" : "bg-muted text-foreground")}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-[15px] font-black">{title}</span>
        <span className="text-xs font-bold text-muted-foreground">{sub}</span>
      </span>
      {checked && <Check className="size-4 shrink-0 text-brand" strokeWidth={3} />}
    </button>
  );
}

function UserBubble({ m }: { m: ChatMessage }) {
  const tags = [m.modes?.pdfOnly && "Answer my PDF", m.modes?.plan && "Study plan"].filter(Boolean) as string[];
  return (
    <div id={`msg-${m.id}`} className="flex max-w-[85%] scroll-mt-4 flex-col items-end gap-1.5 self-end">
      {m.file && (
        <span className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-[13px] font-extrabold">
          {m.file.kind === "pdf" ? <FileText className="size-4 text-brand" /> : <ImageIcon className="size-4 text-brand" />}
          <span className="max-w-[220px] truncate">{m.file.name}</span>
        </span>
      )}
      {!m.hidden && m.text && (
        <p className="rounded-[18px_18px_4px_18px] bg-night px-3.5 py-2.5 text-[15px] leading-snug font-extrabold whitespace-pre-line text-white">{m.text}</p>
      )}
      {tags.length > 0 && <span className="text-xs font-bold text-muted-foreground">{tags.join(" · ")}</span>}
    </div>
  );
}

function AnswerBubble({
  m,
  plan,
  making,
  onPlay,
  onRetry,
  busy,
}: {
  m: ChatMessage;
  plan?: StudyPlan;
  making?: "quiz" | "deck";
  onPlay: (k: "quiz" | "deck") => void;
  onRetry: () => void;
  busy: boolean;
}) {
  if (m.error)
    return (
      <div id={`msg-${m.id}`} className="flex max-w-[90%] scroll-mt-4 items-start gap-2.5 self-start">
        <BotFace />
        <div className="flex flex-col items-start gap-2 rounded-[18px_18px_18px_4px] bg-destructive/10 px-3.5 py-2.5 text-[15px] font-bold text-destructive">
          {m.text}
          <Button variant="soft" size="pill" onClick={onRetry} disabled={busy}>
            <RotateCcw /> Try again
          </Button>
        </div>
      </div>
    );

  return (
    <div id={`msg-${m.id}`} className="flex max-w-[92%] scroll-mt-4 items-start gap-2.5 self-start">
      <BotFace />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-col gap-3 rounded-[18px_18px_18px_4px] bg-card px-3.5 py-3">
          {plan ? <PlanAnswer plan={plan} /> : <p className="text-[15px] leading-relaxed font-semibold whitespace-pre-line text-[#2b3a47]">{plain(m.text)}</p>}
          <div className="flex flex-wrap gap-2 border-t border-line pt-2.5">
            <Button variant="soft" size="pill" className="h-9" onClick={() => onPlay("deck")} disabled={!!making}>
              {making === "deck" ? <Spinner /> : <Layers />} {m.deckId ? "Open flashcards" : "Flashcards"}
            </Button>
            <Button variant="brand" size="pill" className="h-9" onClick={() => onPlay("quiz")} disabled={!!making}>
              {making === "quiz" ? <Spinner /> : <ListChecks />} {m.quizId ? "Open quiz" : "Quiz"}
            </Button>
          </div>
          {making && (
            <span className="text-xs font-bold text-muted-foreground" role="status">
              Making your {making === "quiz" ? "quiz" : "flashcards"} from this answer… this can take about a minute.
            </span>
          )}
        </div>
        {(m.label || plan?.source) && <span className="px-1 text-xs font-bold text-muted-foreground">{m.label ?? plan?.source}</span>}
      </div>
    </div>
  );
}

function PlanAnswer({ plan }: { plan: StudyPlan }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-2 text-xs font-black tracking-[.04em] text-muted-foreground uppercase">
        <CalendarDays className="size-4 text-sky-ink" /> Study plan · {plan.subtopics.length} subtopic{plan.subtopics.length === 1 ? "" : "s"}
      </span>
      <span className="text-[18px] font-black">{plan.title}</span>
      {plan.overview && <p className="text-[15px] leading-relaxed font-semibold text-[#2b3a47]">{plan.overview}</p>}
      <ol className="flex flex-col gap-1.5">
        {plan.subtopics.map((s, i) => (
          <li key={`${plan.id}-${i}`}>
            <Link href={`/learn/plan/${plan.id}/${i}`} className="flex items-center gap-2.5 rounded-xl border border-line bg-background px-2.5 py-2 hover:bg-muted">
              <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-night px-1.5 text-xs font-black text-white">{i + 1}</span>
              <span className="min-w-0 flex-1 text-[14px] font-extrabold">{s.title}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
      <span className="text-xs font-bold text-muted-foreground">Saved to Study Plan on the Learn tab. Tap a subtopic for its full lesson.</span>
    </div>
  );
}
