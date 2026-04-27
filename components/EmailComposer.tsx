"use client";

import React, { useEffect, useMemo, useState } from "react";
import { applyTemplate, sendEmail } from "@/lib/email";
import { useSettings } from "@/lib/settings";
import { newId, type EmailRecord } from "@/lib/phase2";
import { formatCurrency } from "@/lib/estimate";
import type { Estimate, ProjectInfo } from "@/lib/types";

export type EmailComposerInitialState = {
  to: string;
  cc?: string;
  subject?: string;
  body?: string;
};

export function EmailComposer({
  open,
  onClose,
  project,
  estimate,
  attachmentName,
  attachmentData,
  onSent,
  initial,
  title = "Send Proposal",
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectInfo;
  estimate: Estimate;
  attachmentName?: string;
  attachmentData?: string;
  onSent?: (record: EmailRecord) => void;
  initial?: EmailComposerInitialState;
  title?: string;
}) {
  const [settings] = useSettings();
  const email = settings.email;

  const vars = useMemo(
    () => ({
      projectName: project.projectName || "Project",
      clientName: project.clientName || "there",
      clientCompany: project.clientCompany || "",
      proposalNumber: project.proposalNumber || "",
      total: formatCurrency(estimate.grandTotal || 0),
      fromName: email.fromName,
    }),
    [project, estimate, email.fromName],
  );

  const [to, setTo] = useState(initial?.to ?? "");
  const [cc, setCc] = useState(initial?.cc ?? "");
  const [subject, setSubject] = useState(
    initial?.subject ?? applyTemplate(email.defaultSubject, vars),
  );
  const [body, setBody] = useState(
    initial?.body ?? applyTemplate(email.defaultBody, vars),
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTo(initial?.to ?? "");
    setCc(initial?.cc ?? "");
    setSubject(initial?.subject ?? applyTemplate(email.defaultSubject, vars));
    setBody(initial?.body ?? applyTemplate(email.defaultBody, vars));
    setResult(null);
    setError(null);
  }, [open, initial, email.defaultSubject, email.defaultBody, vars]);

  if (!open) return null;

  async function onSend() {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await sendEmail(email, {
        to,
        cc: cc || undefined,
        subject,
        body,
        attachmentName,
        attachmentData,
      });
      const rec: EmailRecord = {
        id: res.id || newId("email"),
        to,
        cc: cc || undefined,
        subject,
        body,
        attachmentName,
        sentAt: new Date().toISOString(),
        status: res.ok ? "sent" : "failed",
      };
      if (!res.ok) {
        setError(res.message);
      } else {
        setResult(res.message);
        onSent?.(rec);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
            From:{" "}
            <span className="font-medium text-slate-700">
              {email.fromName} &lt;{email.fromAddress}&gt;
            </span>
            {" · "}
            Provider:{" "}
            <span className="font-medium text-slate-700">{email.provider}</span>
            {email.provider === "mock" && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
                Mock — not really sent
              </span>
            )}
          </div>
          <Field label="To">
            <input
              className="input"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="client@example.com"
            />
          </Field>
          <Field label="Cc (optional)">
            <input
              className="input"
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="manager@example.com"
            />
          </Field>
          <Field label="Subject">
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Body">
            <textarea
              className="input min-h-[180px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          {attachmentName && (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              📎 Attachment: <span className="font-medium">{attachmentName}</span>
              {attachmentData ? (
                <span className="ml-2 text-slate-400">
                  ({Math.round(attachmentData.length / 1024)} KB)
                </span>
              ) : null}
            </div>
          )}
          {result && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {result}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button type="button" className="btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={onSend}
            disabled={sending || !to}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
