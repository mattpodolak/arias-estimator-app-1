"use client";

import React, { useState } from "react";
import { newId, todayIso, type DailyLog } from "@/lib/phase2";

const EMPTY_LOG = (): DailyLog => ({
  id: newId("log"),
  date: todayIso(),
  weather: "",
  crewCount: 0,
  workPerformed: "",
  issues: "",
  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function DailyLogs({
  logs,
  onChange,
}: {
  logs: DailyLog[] | undefined;
  onChange: (next: DailyLog[]) => void;
}) {
  const list = (logs ?? []).slice().sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
  const [editing, setEditing] = useState<DailyLog | null>(null);

  function save(log: DailyLog) {
    const idx = (logs ?? []).findIndex((l) => l.id === log.id);
    const updated = { ...log, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      const next = [...(logs ?? [])];
      next[idx] = updated;
      onChange(next);
    } else {
      onChange([...(logs ?? []), updated]);
    }
    setEditing(null);
  }

  function del(id: string) {
    if (!confirm("Delete this daily log?")) return;
    onChange((logs ?? []).filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Daily Logs</h3>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => setEditing(EMPTY_LOG())}
        >
          + New entry
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No daily logs yet. Add the first one to start tracking site activity.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Weather</th>
                <th className="px-3 py-2 text-right">Crew</th>
                <th className="px-3 py-2 text-left">Work performed</th>
                <th className="px-3 py-2 text-left">Issues</th>
                <th className="w-32 px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {new Date(l.date + "T00:00:00").toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.weather || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                    {l.crewCount || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="line-clamp-2">{l.workPerformed || "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="line-clamp-2">{l.issues || "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-arias-700 hover:underline"
                      onClick={() => setEditing(l)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-xs text-rose-600 hover:underline"
                      onClick={() => del(l.id)}
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
        <LogEditor
          log={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function LogEditor({
  log,
  onCancel,
  onSave,
}: {
  log: DailyLog;
  onCancel: () => void;
  onSave: (l: DailyLog) => void;
}) {
  const [draft, setDraft] = useState<DailyLog>(log);
  function patch(p: Partial<DailyLog>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">Daily Log</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={draft.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </Field>
          <Field label="Weather">
            <input
              className="input"
              placeholder="Sunny, 72°F"
              value={draft.weather}
              onChange={(e) => patch({ weather: e.target.value })}
            />
          </Field>
          <Field label="Crew count">
            <input
              type="number"
              min={0}
              className="input"
              value={draft.crewCount}
              onChange={(e) =>
                patch({ crewCount: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </Field>
          <div />
          <div className="sm:col-span-2">
            <Field label="Work performed">
              <textarea
                className="input min-h-[100px]"
                value={draft.workPerformed}
                onChange={(e) => patch({ workPerformed: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Issues">
              <textarea
                className="input min-h-[80px]"
                value={draft.issues}
                onChange={(e) => patch({ issues: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className="input min-h-[80px]"
                value={draft.notes}
                onChange={(e) => patch({ notes: e.target.value })}
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
