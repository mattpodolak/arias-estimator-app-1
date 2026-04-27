"use client";

import React, { useCallback, useRef, useState } from "react";
import type { ExtractApiResponse, ExtractionResult } from "@/lib/types";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_BYTES = 22 * 1024 * 1024; // ~22 MB to stay under server bodySizeLimit (25 MB) after base64 expansion

function bytesToHuman(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

export function UploadStep({
  onExtracted,
}: {
  onExtracted: (file: File, result: ExtractionResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptFile = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(
        `File is too large (${bytesToHuman(f.size)}). Max is ${bytesToHuman(MAX_BYTES)}.`,
      );
      return;
    }
    if (!ACCEPT.split(",").some((m) => f.type === m)) {
      setError(`Unsupported file type: ${f.type || "unknown"}.`);
      return;
    }
    setFile(f);
  }, []);

  async function runExtract() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgressLabel("Uploading and analyzing plans with Gemini…");
    try {
      const data = await fileToBase64(file);
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          data,
        }),
      });
      const payload = (await res.json()) as ExtractApiResponse;
      if (!payload.ok) {
        setError(payload.error);
        return;
      }
      onExtracted(file, payload.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setProgressLabel(null);
    }
  }

  return (
    <section className="card p-8">
      <h2 className="text-lg font-semibold text-slate-900">Upload construction plans</h2>
      <p className="mt-1 text-sm text-slate-500">
        Drop a PDF or image of plans below. Gemini will extract takeoff quantities for
        drywall, framing, finishing, and openings.
      </p>

      <label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0] ?? null;
          acceptFile(f);
        }}
        className={[
          "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition",
          dragOver
            ? "border-arias bg-arias-50/60"
            : "border-slate-300 bg-slate-50 hover:border-arias-200 hover:bg-white",
        ].join(" ")}
      >
        <svg
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-arias"
        >
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-3 text-sm font-medium text-slate-700">
          Drag &amp; drop, or click to browse
        </div>
        <div className="mt-1 text-xs text-slate-500">
          PDF, PNG, JPG, WebP · up to {bytesToHuman(MAX_BYTES)}
        </div>
        <input
          id="file-input"
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-700">{file.name}</div>
            <div className="text-xs text-slate-500">
              {file.type || "unknown"} · {bytesToHuman(file.size)}
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {progressLabel ?? "Quantities can be edited in the next step."}
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={runExtract}
          disabled={!file || busy}
        >
          {busy ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : (
            "Extract quantities →"
          )}
        </button>
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
