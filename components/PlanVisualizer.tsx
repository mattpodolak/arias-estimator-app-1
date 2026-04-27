"use client";

import React, { useState } from "react";
import type { PlanFile } from "./PlanQAChat";

export function PlanVisualizer({
  file,
  image,
  onImageChange,
}: {
  file: PlanFile | null;
  image: string | null;
  onImageChange: (image: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function generate() {
    if (!file) {
      setError("Upload a plan first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.fileName,
          mimeType: file.mimeType,
          data: file.data,
        }),
      });
      const payload = await res.json();
      if (!payload?.ok) {
        setError(payload?.error || "Visualization failed.");
        return;
      }
      onImageChange(payload.image);
      if (payload.note) setNote(payload.note);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = "plan-3d-view.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            3D Visualization
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Generate a 3D render of the plan using Gemini.
          </p>
        </div>
        <div className="flex gap-2">
          {image && (
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={download}
            >
              Download
            </button>
          )}
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={generate}
            disabled={!file || busy}
          >
            {busy ? "Generating…" : image ? "Regenerate" : "Generate 3D view"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {!file && !image && (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
          Upload a plan to enable 3D rendering.
        </div>
      )}

      {file && !image && !busy && !error && (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
          Click <strong className="text-slate-700">Generate 3D view</strong> to render this
          plan. Generation can take 20–60 seconds.
        </div>
      )}

      {busy && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
          Rendering 3D visualization… this can take up to a minute.
        </div>
      )}

      {image && (
        <div className="mt-4">
          <div className="overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Generated 3D visualization"
              className="block h-auto w-full"
            />
          </div>
          {note && (
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Model note:</span> {note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
