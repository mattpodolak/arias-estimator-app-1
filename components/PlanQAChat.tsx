"use client";

import React, { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export type PlanFile = {
  fileName: string;
  mimeType: string;
  data: string;
};

const SUGGESTIONS = [
  "What is the ceiling height?",
  "How many doors are shown?",
  "What's the total drywall area?",
  "Describe the kitchen layout.",
];

export function PlanQAChat({
  file,
  initialMessages,
  onMessagesChange,
}: {
  file: PlanFile | null;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    onMessagesChange?.(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function ask(question: string) {
    if (!file) {
      setError("Upload a plan first to enable Q&A.");
      return;
    }
    if (!question.trim() || busy) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages,
          fileName: file.fileName,
          mimeType: file.mimeType,
          data: file.data,
        }),
      });
      const payload = await res.json();
      if (!payload?.ok) {
        setError(payload?.error || "Q&A request failed.");
        setMessages(next);
      } else {
        setMessages([...next, { role: "model", text: payload.answer }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  return (
    <section className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Plan Q&amp;A</h3>
          <p className="text-xs text-slate-500">
            Ask questions about the uploaded plan.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-rose-600"
            onClick={clear}
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[420px] min-h-[260px] flex-col gap-3 overflow-y-auto px-5 py-4"
      >
        {messages.length === 0 && !busy && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {file
                ? "Try one of these to get started:"
                : "Upload a plan above to enable plan Q&A."}
            </p>
            {file && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:border-arias-200 hover:bg-arias-50"
                    onClick={() => ask(s)}
                    disabled={busy}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
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
        className="flex items-center gap-2 border-t border-slate-100 px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="input"
          placeholder={
            file
              ? "Ask about the plan…"
              : "Upload a plan to enable Q&A"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!file || busy}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!file || busy || !input.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}

function Bubble({ role, text }: { role: "user" | "model"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-arias text-white"
            : "border border-slate-200 bg-slate-50 text-slate-800",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}
