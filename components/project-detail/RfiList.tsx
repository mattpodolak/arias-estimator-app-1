"use client";

import React, { useState } from "react";
import { addDaysIso, newId, todayIso, type Rfi, type RfiStatus } from "@/lib/phase2";

const STATUS_LABEL: Record<RfiStatus, string> = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

const STATUS_BADGE: Record<RfiStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  answered: "bg-arias-50 text-arias-700",
  closed: "bg-emerald-100 text-emerald-700",
};

const newRfi = (suggestedNumber: string): Rfi => ({
  id: newId("rfi"),
  number: suggestedNumber,
  subject: "",
  to: "",
  question: "",
  dateSent: todayIso(),
  dateDue: addDaysIso(todayIso(), 7),
  status: "open",
  response: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function RfiList({
  rfis,
  onChange,
}: {
  rfis: Rfi[] | undefined;
  onChange: (next: Rfi[]) => void;
}) {
  const list = (rfis ?? []).slice().sort((a, b) =>
    a.dateSent < b.dateSent ? 1 : -1,
  );
  const [editing, setEditing] = useState<Rfi | null>(null);

  function nextNumber(): string {
    const nums = (rfis ?? [])
      .map((r) => Number((r.number || "").replace(/\D/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `RFI-${String(max + 1).padStart(3, "0")}`;
  }

  function save(rfi: Rfi) {
    const updated = { ...rfi, updatedAt: new Date().toISOString() };
    const idx = (rfis ?? []).findIndex((r) => r.id === rfi.id);
    if (idx >= 0) {
      const next = [...(rfis ?? [])];
      next[idx] = updated;
      onChange(next);
    } else {
      onChange([...(rfis ?? []), updated]);
    }
    setEditing(null);
  }

  function del(id: string) {
    if (!confirm("Delete this RFI?")) return;
    onChange((rfis ?? []).filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">RFIs</h3>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => setEditing(newRfi(nextNumber()))}
        >
          + New RFI
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No RFIs yet. Track requests for information sent to the GC, owner, or
          design team.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">To</th>
                <th className="px-3 py-2 text-left">Sent</th>
                <th className="px-3 py-2 text-left">Due</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="w-28 px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {r.number}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.subject || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.to || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(r.dateSent + "T00:00:00").toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(r.dateDue + "T00:00:00").toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={["badge", STATUS_BADGE[r.status]].join(" ")}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-arias-700 hover:underline"
                      onClick={() => setEditing(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-xs text-rose-600 hover:underline"
                      onClick={() => del(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <RfiEditor
          rfi={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function RfiEditor({
  rfi,
  onCancel,
  onSave,
}: {
  rfi: Rfi;
  onCancel: () => void;
  onSave: (r: Rfi) => void;
}) {
  const [draft, setDraft] = useState<Rfi>(rfi);
  function patch(p: Partial<Rfi>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">
            {draft.number || "New RFI"}
          </h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="RFI #">
            <input
              className="input"
              value={draft.number}
              onChange={(e) => patch({ number: e.target.value })}
            />
          </Field>
          <Field label="Subject">
            <input
              className="input"
              value={draft.subject}
              onChange={(e) => patch({ subject: e.target.value })}
              placeholder="e.g., Door schedule clarification"
            />
          </Field>
          <Field label="To">
            <input
              className="input"
              value={draft.to}
              onChange={(e) => patch({ to: e.target.value })}
              placeholder="GC / Owner / Architect contact"
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={draft.status}
              onChange={(e) =>
                patch({ status: e.target.value as RfiStatus })
              }
            >
              {(Object.keys(STATUS_LABEL) as RfiStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date sent">
            <input
              type="date"
              className="input"
              value={draft.dateSent}
              onChange={(e) => patch({ dateSent: e.target.value })}
            />
          </Field>
          <Field label="Due">
            <input
              type="date"
              className="input"
              value={draft.dateDue}
              onChange={(e) => patch({ dateDue: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Question">
              <textarea
                className="input min-h-[120px]"
                value={draft.question}
                onChange={(e) => patch({ question: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Response">
              <textarea
                className="input min-h-[120px]"
                value={draft.response}
                onChange={(e) =>
                  patch({
                    response: e.target.value,
                    respondedAt:
                      e.target.value && !draft.respondedAt
                        ? new Date().toISOString()
                        : draft.respondedAt,
                  })
                }
              />
            </Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button type="button" className="btn-ghost text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
