"use client";

import React, { useRef, useState } from "react";
import {
  newId,
  type PhotoEntry,
  type PunchItem,
  type PunchStatus,
} from "@/lib/phase2";

const STATUS_LABEL: Record<PunchStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  complete: "Complete",
};

const STATUS_BADGE: Record<PunchStatus, string> = {
  open: "bg-slate-100 text-slate-700",
  "in-progress": "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-700",
};

const newItem = (): PunchItem => ({
  id: newId("punch"),
  location: "",
  description: "",
  assignedTo: "",
  status: "open",
  photoIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function PunchList({
  items,
  photos,
  onChangeItems,
  onChangePhotos,
}: {
  items: PunchItem[] | undefined;
  photos: PhotoEntry[] | undefined;
  onChangeItems: (next: PunchItem[]) => void;
  onChangePhotos: (next: PhotoEntry[]) => void;
}) {
  const list = items ?? [];
  const photoList = photos ?? [];
  const [editing, setEditing] = useState<PunchItem | null>(null);

  function save(item: PunchItem) {
    const updated = {
      ...item,
      updatedAt: new Date().toISOString(),
      completedAt:
        item.status === "complete"
          ? item.completedAt ?? new Date().toISOString()
          : undefined,
    };
    const idx = list.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = updated;
      onChangeItems(next);
    } else {
      onChangeItems([...list, updated]);
    }
    setEditing(null);
  }

  function toggleComplete(item: PunchItem) {
    save({
      ...item,
      status: item.status === "complete" ? "open" : "complete",
    });
  }

  function del(id: string) {
    if (!confirm("Delete this punch item?")) return;
    onChangeItems(list.filter((p) => p.id !== id));
  }

  const open = list.filter((p) => p.status !== "complete");
  const complete = list.filter((p) => p.status === "complete");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Punch List</h3>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => setEditing(newItem())}
        >
          + New punch item
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No punch items yet. Track outstanding work to close out the project.
        </div>
      ) : (
        <>
          <Section
            title={`Open (${open.length})`}
            items={open}
            photoList={photoList}
            onEdit={setEditing}
            onToggle={toggleComplete}
            onDelete={del}
          />
          {complete.length > 0 && (
            <Section
              title={`Complete (${complete.length})`}
              items={complete}
              photoList={photoList}
              onEdit={setEditing}
              onToggle={toggleComplete}
              onDelete={del}
              muted
            />
          )}
        </>
      )}

      {editing && (
        <PunchEditor
          item={editing}
          photos={photoList}
          onChangePhotos={onChangePhotos}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  photoList,
  onEdit,
  onToggle,
  onDelete,
  muted,
}: {
  title: string;
  items: PunchItem[];
  photoList: PhotoEntry[];
  onEdit: (i: PunchItem) => void;
  onToggle: (i: PunchItem) => void;
  onDelete: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((p) => {
          const refs = p.photoIds
            .map((id) => photoList.find((ph) => ph.id === id))
            .filter(Boolean) as PhotoEntry[];
          return (
            <li
              key={p.id}
              className={[
                "flex items-start gap-3 px-4 py-3",
                muted ? "opacity-70" : "",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={p.status === "complete"}
                onChange={() => onToggle(p)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "text-sm font-medium text-slate-800",
                      p.status === "complete" ? "line-through" : "",
                    ].join(" ")}
                  >
                    {p.description || "Untitled item"}
                  </span>
                  <span className={["badge", STATUS_BADGE[p.status]].join(" ")}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {p.location && <span>📍 {p.location}</span>}
                  {p.location && p.assignedTo && <span className="mx-2">·</span>}
                  {p.assignedTo && <span>👤 {p.assignedTo}</span>}
                </div>
                {refs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {refs.map((ph) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={ph.id}
                        src={ph.dataUrl}
                        alt={ph.description}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="text-xs text-arias-700 hover:underline"
                  onClick={() => onEdit(p)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-rose-600 hover:underline"
                  onClick={() => onDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PunchEditor({
  item,
  photos,
  onChangePhotos,
  onCancel,
  onSave,
}: {
  item: PunchItem;
  photos: PhotoEntry[];
  onChangePhotos: (next: PhotoEntry[]) => void;
  onCancel: () => void;
  onSave: (i: PunchItem) => void;
}) {
  const [draft, setDraft] = useState<PunchItem>(item);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  function patch(p: Partial<PunchItem>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  async function attachPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const additions: PhotoEntry[] = [];
      const newIds: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error("read failed"));
          reader.readAsDataURL(file);
        });
        const id = newId("photo");
        newIds.push(id);
        additions.push({
          id,
          dataUrl,
          description: `Punch — ${draft.description || "item"}`,
          tags: ["punch"],
          capturedAt: new Date().toISOString().slice(0, 10),
          uploadedAt: new Date().toISOString(),
        });
      }
      if (additions.length > 0) {
        onChangePhotos([...photos, ...additions]);
        patch({ photoIds: [...draft.photoIds, ...newIds] });
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    patch({ photoIds: draft.photoIds.filter((p) => p !== id) });
  }

  const refs = draft.photoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as PhotoEntry[];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">Punch Item</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="Description">
            <input
              className="input"
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="e.g., Touch up paint at door 102"
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={draft.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="Room / area"
            />
          </Field>
          <Field label="Assigned to">
            <input
              className="input"
              value={draft.assignedTo}
              onChange={(e) => patch({ assignedTo: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={draft.status}
              onChange={(e) =>
                patch({ status: e.target.value as PunchStatus })
              }
            >
              {(Object.keys(STATUS_LABEL) as PunchStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <span className="label">Photos</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {refs.map((ph) => (
                <div
                  key={ph.id}
                  className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.dataUrl}
                    alt={ph.description}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 rounded-bl-md bg-white/90 px-1 text-xs text-rose-600"
                    onClick={() => removePhoto(ph.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50">
                + Photo
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => attachPhotos(e.target.files)}
                  disabled={busy}
                />
              </label>
            </div>
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
