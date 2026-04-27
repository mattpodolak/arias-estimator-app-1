"use client";

import React, { useEffect, useState } from "react";
import type { Estimate, ProjectInfo, SignatureRequest } from "@/lib/types";
import { COMPANY } from "@/lib/defaults";
import { formatCurrency } from "@/lib/estimate";

export function SignStep({
  project,
  estimate,
  onBack,
  onReset,
}: {
  project: ProjectInfo;
  estimate: Estimate;
  onBack: () => void;
  onReset: () => void;
}) {
  const [contractorEmail, setContractorEmail] = useState(COMPANY.email);
  const [clientEmail, setClientEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sig, setSig] = useState<SignatureRequest | null>(null);

  useEffect(() => {
    if (!sig?.id) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/sign?id=${encodeURIComponent(sig.id)}`);
        const d = await r.json();
        if (!cancelled && d?.ok) setSig(d.signature);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sig?.id]);

  async function send() {
    if (!clientEmail.trim()) {
      setError("Client email is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorEmail,
          clientEmail,
          proposalNumber: project.proposalNumber,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || "Failed to create signing request.");
        return;
      }
      setSig(data.signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (sig?.signingUrl) {
      navigator.clipboard?.writeText(sig.signingUrl).catch(() => {});
    }
  }

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Send for signature</h2>
        <p className="mt-1 text-sm text-slate-500">
          Generate a signing link for the client. This MVP uses a placeholder e-sign
          implementation — swap in DocuSign / Dropbox Sign / Adobe Sign for production.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Contractor email</label>
            <input
              className="input mt-1"
              value={contractorEmail}
              onChange={(e) => setContractorEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Client email</label>
            <input
              className="input mt-1"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
        </div>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <span className="font-semibold text-slate-700">Project:</span>{" "}
              {project.projectName || "—"}
            </span>
            <span>
              <span className="font-semibold text-slate-700">Proposal #:</span>{" "}
              {project.proposalNumber || "—"}
            </span>
            <span>
              <span className="font-semibold text-slate-700">Total:</span>{" "}
              {formatCurrency(estimate.grandTotal)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="btn-primary"
            onClick={send}
            disabled={busy || !clientEmail.trim()}
          >
            {busy ? "Generating link…" : sig ? "Re-send signing link" : "Generate signing link"}
          </button>
        </div>
      </div>

      {sig && (
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Signing request created
              </h3>
              <p className="mt-1 text-xs text-slate-500">ID {sig.id}</p>
            </div>
            <span
              className={[
                "badge",
                sig.status === "signed"
                  ? "bg-emerald-100 text-emerald-700"
                  : sig.status === "declined"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-arias-100 text-arias-700",
              ].join(" ")}
            >
              {sig.status.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Sent to" value={sig.clientEmail} />
            <Info
              label="From"
              value={sig.contractorEmail || COMPANY.email}
            />
            <Info label="Created" value={new Date(sig.createdAt).toLocaleString()} />
            {sig.signedAt && (
              <Info label="Signed" value={new Date(sig.signedAt).toLocaleString()} />
            )}
          </div>

          <div className="mt-4">
            <label className="label">Signing link</label>
            <div className="mt-1 flex gap-2">
              <input className="input font-mono text-xs" readOnly value={sig.signingUrl} />
              <button type="button" className="btn-secondary text-xs" onClick={copyLink}>
                Copy
              </button>
              <a
                href={sig.signingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs"
              >
                Open
              </a>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Status will refresh every 4 seconds. Open the link, type a name, and click
              "Sign proposal" to simulate the client signing.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn-ghost" onClick={onReset}>
          Start a new proposal
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-700">{value}</div>
    </div>
  );
}
