"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Role = "user" | "model";

type ChatMessage = {
  role: Role;
  text: string;
  attachmentName?: string;
};

type Attachment = {
  fileName: string;
  mimeType: string;
  data: string;
  size: number;
};

type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const STORAGE_KEY = "arias.chat.v1";
const MAX_INLINE_BYTES = 18 * 1024 * 1024; // ~18MB; we'll forward to Files API server-side
const SUGGESTIONS = [
  "What's a typical labor cost per SF for drywall hang & finish in California?",
  "Outline a rough scope for a 2,000 SF tenant improvement build-out.",
  "What's the difference between Level 4 and Level 5 drywall finish?",
  "How do I estimate HVAC tonnage for a 1,800 SF office?",
];

export default function ChatPage() {
  const [hydrated, setHydrated] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load threads from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let parsed: ChatThread[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw) as ChatThread[];
    } catch {
      parsed = [];
    }
    setThreads(parsed);
    setActiveId(parsed[0]?.id ?? null);
    setHydrated(true);
  }, []);

  // Persist on every thread change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads, hydrated]);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, busy, threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  function newThreadId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function startNewThread() {
    const id = newThreadId();
    const now = new Date().toISOString();
    const fresh: ChatThread = {
      id,
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setThreads((prev) => [fresh, ...prev]);
    setActiveId(id);
    setDraft("");
    setAttachment(null);
    setError(null);
  }

  function deleteThread(id: string) {
    if (!confirm("Delete this conversation?")) return;
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function clearAttachment() {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function pickFile(file: File) {
    setError(null);
    if (file.size > MAX_INLINE_BYTES) {
      setError(
        `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB — please attach files under 18 MB.`,
      );
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(file);
    });
    setAttachment({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      data,
      size: file.size,
    });
  }

  async function send(prefill?: string) {
    const text = (prefill ?? draft).trim();
    if (!text || busy) return;
    setError(null);

    // Materialize a thread if none active.
    let workingId = activeId;
    if (!workingId) {
      workingId = newThreadId();
      const now = new Date().toISOString();
      const fresh: ChatThread = {
        id: workingId,
        title: text.slice(0, 60),
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      setThreads((prev) => [fresh, ...prev]);
      setActiveId(workingId);
    }

    const finalId = workingId;
    const userMsg: ChatMessage = {
      role: "user",
      text,
      attachmentName: attachment?.fileName,
    };

    // Snapshot history (without the new user message) for the API call.
    const historyForApi = (
      threads.find((t) => t.id === finalId)?.messages ?? []
    ).map((m) => ({ role: m.role, text: m.text }));

    setThreads((prev) =>
      prev.map((t) =>
        t.id === finalId
          ? {
              ...t,
              title:
                t.messages.length === 0 && t.title === "New conversation"
                  ? text.slice(0, 60) || "New conversation"
                  : t.title,
              messages: [...t.messages, userMsg],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    setDraft("");
    setBusy(true);

    const attachmentForApi = attachment
      ? {
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          data: attachment.data,
        }
      : null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyForApi,
          attachment: attachmentForApi,
        }),
      });
      const payload = await res.json();
      if (!payload?.ok) {
        setError(payload?.error || "Chat request failed.");
      } else {
        const reply: ChatMessage = { role: "model", text: payload.answer };
        setThreads((prev) =>
          prev.map((t) =>
            t.id === finalId
              ? {
                  ...t,
                  messages: [...t.messages, reply],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      // Keep the attachment available for follow-up turns? Clear by default — user can re-attach.
      clearAttachment();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send();
  }

  function onSuggestion(s: string) {
    setDraft(s);
    void send(s);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="grid w-full flex-1 gap-4 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="card flex h-fit flex-col overflow-hidden lg:h-[calc(100vh-160px)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Conversations
              </h2>
              <button
                type="button"
                className="text-xs font-medium text-arias-700 hover:underline"
                onClick={startNewThread}
              >
                + New
              </button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto p-2">
              {threads.length === 0 && hydrated && (
                <p className="px-2 py-3 text-xs text-slate-500">
                  No conversations yet — start one below.
                </p>
              )}
              {threads.map((t) => {
                const active = t.id === activeId;
                return (
                  <div
                    key={t.id}
                    className={[
                      "group flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition",
                      active
                        ? "bg-arias-50 text-arias-800"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(t.id)}
                      className="flex-1 truncate text-left"
                      title={t.title}
                    >
                      {t.title || "Untitled"}
                    </button>
                    <button
                      type="button"
                      className="text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-600"
                      onClick={() => deleteThread(t.id)}
                      title="Delete conversation"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main chat */}
          <section className="card flex h-[calc(100vh-160px)] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div>
                <h1 className="text-base font-semibold text-slate-900">
                  AI Assistant
                </h1>
                <p className="text-xs text-slate-500">
                  Ask any construction question. Attach plans for grounded
                  answers.
                </p>
              </div>
              {activeThread && activeThread.messages.length > 0 && (
                <span className="text-xs text-slate-500">
                  {activeThread.messages.length} message
                  {activeThread.messages.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
            >
              {(!activeThread || activeThread.messages.length === 0) && !busy && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">
                      Hey — I'm your construction co-pilot.
                    </p>
                    <p className="mt-1 text-slate-600">
                      Ask about pricing, plan reading, scope, code, or anything
                      else. Drop a PDF or photo to ground my answer in your
                      drawings.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-arias-200 hover:bg-arias-50"
                        onClick={() => onSuggestion(s)}
                        disabled={busy}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeThread?.messages.map((m, i) => (
                <Bubble key={i} message={m} />
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-arias" />
                  Thinking…
                </div>
              )}
            </div>

            {error && (
              <div className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="border-t border-slate-100 bg-white px-3 py-3"
            >
              {attachment && (
                <div className="mb-2 flex items-center justify-between rounded-md border border-arias-200 bg-arias-50 px-3 py-2 text-xs text-arias-800">
                  <span className="truncate">
                    📎 {attachment.fileName}{" "}
                    <span className="text-arias-600">
                      ({(attachment.size / 1024).toFixed(0)} KB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="text-arias-600 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pickFile(f);
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost px-3"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a plan or photo"
                  disabled={busy}
                >
                  📎
                </button>
                <textarea
                  className="input min-h-[44px] flex-1 resize-y"
                  rows={1}
                  placeholder="Ask anything about construction…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  disabled={busy}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || !draft.trim()}
                >
                  Send
                </button>
              </div>
              <p className="mt-1 px-1 text-[11px] text-slate-400">
                Press Enter to send, Shift+Enter for a new line. Conversations
                are stored on this device.
              </p>
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-arias text-white"
            : "border border-slate-200 bg-white text-slate-800",
        ].join(" ")}
      >
        {message.attachmentName && isUser && (
          <div className="mb-1 text-[11px] text-arias-100/90">
            📎 {message.attachmentName}
          </div>
        )}
        {message.text}
      </div>
    </div>
  );
}
