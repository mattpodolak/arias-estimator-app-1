"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { COMPANY } from "@/lib/defaults";

type Sig = {
  id: string;
  status: string;
  clientEmail: string;
  contractorEmail: string;
  createdAt: string;
  signedAt?: string;
};

export default function SignPage({ params }: { params: { id: string } }) {
  const [sig, setSig] = useState<Sig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sign?id=${encodeURIComponent(params.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) setSig(data.signature);
        else setError(data?.error || "Not found");
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onSign() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, status: "signed" }),
      });
      const data = await res.json();
      if (data?.ok) {
        setSig(data.signature);
        setSubmitted(true);
      } else {
        setError(data?.error || "Failed to record signature.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="card p-8">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Signature request — placeholder demo
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Review &amp; sign your proposal
            </h1>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : sig ? (
            <div className="space-y-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Request ID
                  </dt>
                  <dd className="font-mono text-slate-700">{sig.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Status
                  </dt>
                  <dd className="font-semibold text-arias-700">{sig.status}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Client
                  </dt>
                  <dd className="text-slate-700">{sig.clientEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Contractor
                  </dt>
                  <dd className="text-slate-700">
                    {sig.contractorEmail || COMPANY.email}
                  </dd>
                </div>
              </dl>

              {sig.status === "signed" || submitted ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Signed{sig.signedAt ? ` on ${new Date(sig.signedAt).toLocaleString()}` : ""}.
                  Thank you — a copy of the executed proposal will be emailed to you.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="label" htmlFor="signname">
                    Type your full legal name to sign
                  </label>
                  <input
                    id="signname"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jordan Client"
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onSign}
                    disabled={!name.trim() || submitting}
                  >
                    {submitting ? "Recording…" : "Sign proposal"}
                  </button>
                  <p className="text-xs text-slate-500">
                    This is a placeholder e-sign experience. No legally-binding signature
                    is being captured — integrate DocuSign / Dropbox Sign / Adobe Sign for
                    production.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          {COMPANY.name} · {COMPANY.tagline} · {COMPANY.license}
        </div>
      </div>
    </main>
  );
}
