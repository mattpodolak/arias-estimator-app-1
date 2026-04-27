"use client";

import React, { useRef, useState } from "react";
import { newId, todayIso, type PhotoEntry } from "@/lib/phase2";

export function PhotoGallery({
  photos,
  onChange,
}: {
  photos: PhotoEntry[] | undefined;
  onChange: (next: PhotoEntry[]) => void;
}) {
  const list = photos ?? [];
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [zoom, setZoom] = useState<PhotoEntry | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const additions: PhotoEntry[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError(`Skipped ${file.name} — not an image.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is over 5 MB — skipped.`);
          continue;
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error("read failed"));
          reader.readAsDataURL(file);
        });
        additions.push({
          id: newId("photo"),
          dataUrl,
          description: file.name.replace(/\.[^.]+$/, ""),
          tags: [],
          capturedAt: todayIso(),
          uploadedAt: new Date().toISOString(),
        });
      }
      if (additions.length > 0) {
        onChange([...list, ...additions]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function patchPhoto(id: string, patch: Partial<PhotoEntry>) {
    onChange(list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deletePhoto(id: string) {
    if (!confirm("Delete this photo?")) return;
    onChange(list.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add photos</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Stored as data URLs in localStorage. Keep individual images under
              5 MB for browser storage limits.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="block w-full max-w-xs text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-arias-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-arias-700 hover:file:bg-arias-100"
            disabled={busy}
          />
        </div>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        {busy && <p className="mt-2 text-xs text-slate-500">Uploading…</p>}
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No photos yet. Click <span className="font-medium">Add photos</span>{" "}
          above to upload site documentation.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.description}
                className="block h-40 w-full cursor-zoom-in object-cover"
                onClick={() => setZoom(p)}
              />
              <div className="space-y-2 px-3 py-3">
                {editing === p.id ? (
                  <>
                    <input
                      className="input text-sm"
                      value={p.description}
                      onChange={(e) =>
                        patchPhoto(p.id, { description: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="input text-sm"
                      value={p.capturedAt}
                      onChange={(e) =>
                        patchPhoto(p.id, { capturedAt: e.target.value })
                      }
                    />
                    <input
                      className="input text-sm"
                      value={p.tags.join(", ")}
                      placeholder="tags, comma-separated"
                      onChange={(e) =>
                        patchPhoto(p.id, {
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => setEditing(null)}
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-slate-800">
                      {p.description || "Untitled"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(p.capturedAt + "T00:00:00").toLocaleDateString()}
                    </div>
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="badge bg-arias-50 text-arias-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <button
                        type="button"
                        className="text-xs text-arias-700 hover:underline"
                        onClick={() => setEditing(p.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-rose-600 hover:underline"
                        onClick={() => deletePhoto(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setZoom(null)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom.dataUrl}
              alt={zoom.description}
              className="block max-h-[85vh] max-w-full rounded-md object-contain"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-white/90">
              <span>
                {zoom.description}{" "}
                <span className="text-white/60">
                  · {new Date(zoom.capturedAt + "T00:00:00").toLocaleDateString()}
                </span>
              </span>
              <button
                type="button"
                className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
                onClick={() => setZoom(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
