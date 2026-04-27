"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/estimate";
import type { Estimate, ProjectInfo, ProposalConfig } from "@/lib/types";
import { ProposalDocument } from "./ProposalDocument";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="btn-primary">Preparing PDF…</span> },
);

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false, loading: () => <PreviewPlaceholder label="Loading preview…" /> },
);

function PreviewPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-[640px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
      {label}
    </div>
  );
}

export function ProposalStep({
  project,
  setProject,
  proposal,
  setProposal,
  estimate,
  onBack,
  onContinue,
}: {
  project: ProjectInfo;
  setProject: (p: ProjectInfo) => void;
  proposal: ProposalConfig;
  setProposal: (p: ProposalConfig) => void;
  estimate: Estimate;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const paymentTotal = useMemo(
    () => proposal.paymentSchedule.reduce((s, m) => s + (Number(m.percent) || 0), 0),
    [proposal.paymentSchedule],
  );

  const fileBaseName =
    (project.proposalNumber || "ARIAS-PROPOSAL").replace(/[^A-Za-z0-9_-]+/g, "_") +
    ".pdf";

  function patchProject(p: Partial<ProjectInfo>) {
    setProject({ ...project, ...p });
  }
  function patchProposal(p: Partial<ProposalConfig>) {
    setProposal({ ...proposal, ...p });
  }

  function setMilestone(idx: number, patch: Partial<{ label: string; percent: number }>) {
    patchProposal({
      paymentSchedule: proposal.paymentSchedule.map((m, i) =>
        i === idx ? { ...m, ...patch } : m,
      ),
    });
  }
  function addMilestone() {
    patchProposal({
      paymentSchedule: [
        ...proposal.paymentSchedule,
        { label: "Additional milestone", percent: 0 },
      ],
    });
  }
  function removeMilestone(idx: number) {
    patchProposal({
      paymentSchedule: proposal.paymentSchedule.filter((_, i) => i !== idx),
    });
  }

  function setExclusion(idx: number, value: string) {
    patchProposal({
      exclusions: proposal.exclusions.map((e, i) => (i === idx ? value : e)),
    });
  }
  function addExclusion() {
    patchProposal({ exclusions: [...proposal.exclusions, "New exclusion"] });
  }
  function removeExclusion(idx: number) {
    patchProposal({ exclusions: proposal.exclusions.filter((_, i) => i !== idx) });
  }

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Project information</h2>
        <p className="mt-1 text-sm text-slate-500">
          These details appear on the cover page and signature block of the proposal.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Project name">
            <input
              className="input"
              value={project.projectName}
              onChange={(e) => patchProject({ projectName: e.target.value })}
              placeholder="e.g., Riverside TI — Suite 200"
            />
          </Field>
          <Field label="Project address">
            <input
              className="input"
              value={project.projectAddress}
              onChange={(e) => patchProject({ projectAddress: e.target.value })}
              placeholder="123 Main St, Anaheim, CA 92805"
            />
          </Field>
          <Field label="Client / Owner">
            <input
              className="input"
              value={project.clientName}
              onChange={(e) => patchProject({ clientName: e.target.value })}
              placeholder="Client primary contact"
            />
          </Field>
          <Field label="Client company">
            <input
              className="input"
              value={project.clientCompany}
              onChange={(e) => patchProject({ clientCompany: e.target.value })}
              placeholder="Company / GC"
            />
          </Field>
          <Field label="General contractor (if different)">
            <input
              className="input"
              value={project.generalContractor}
              onChange={(e) => patchProject({ generalContractor: e.target.value })}
            />
          </Field>
          <Field label="Prepared by">
            <input
              className="input"
              value={project.preparedBy}
              onChange={(e) => patchProject({ preparedBy: e.target.value })}
            />
          </Field>
          <Field label="Proposal #">
            <input
              className="input"
              value={project.proposalNumber}
              onChange={(e) => patchProject({ proposalNumber: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={project.proposalDate}
              onChange={(e) => patchProject({ proposalDate: e.target.value })}
            />
          </Field>
          <Field label="Valid for (days)">
            <input
              type="number"
              min={1}
              className="input"
              value={project.validForDays}
              onChange={(e) =>
                patchProject({ validForDays: Math.max(1, Number(e.target.value) || 30) })
              }
            />
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Scope of work</h2>
        <p className="mt-1 text-sm text-slate-500">
          Describe what's included. This appears as the proposal narrative.
        </p>
        <textarea
          className="input mt-4 min-h-[140px]"
          value={proposal.scopeOfWork}
          onChange={(e) => patchProposal({ scopeOfWork: e.target.value })}
        />
        <div className="mt-4">
          <label className="label">Additional notes (optional)</label>
          <textarea
            className="input mt-1"
            value={proposal.notes}
            onChange={(e) => patchProposal({ notes: e.target.value })}
            placeholder="Any callouts, schedule notes, or special conditions"
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Total must equal 100%. Default is four 25% milestones.
            </p>
          </div>
          <span
            className={[
              "badge",
              Math.abs(paymentTotal - 100) < 0.001
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            ].join(" ")}
          >
            {paymentTotal.toFixed(1)}% allocated
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {proposal.paymentSchedule.map((m, idx) => (
            <div key={idx} className="grid items-center gap-3 sm:grid-cols-[1fr_120px_140px_40px]">
              <input
                className="input"
                value={m.label}
                onChange={(e) => setMilestone(idx, { label: e.target.value })}
              />
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  className="input pr-8 text-right"
                  value={m.percent}
                  onChange={(e) =>
                    setMilestone(idx, { percent: Number(e.target.value) || 0 })
                  }
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-400">
                  %
                </span>
              </div>
              <div className="text-right text-sm font-semibold tabular-nums text-slate-700">
                {formatCurrency((estimate.grandTotal * (Number(m.percent) || 0)) / 100)}
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-rose-600"
                onClick={() => removeMilestone(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary mt-4" onClick={addMilestone}>
          + Add milestone
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Exclusions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Items expressly NOT included in this proposal.
        </p>
        <ul className="mt-4 space-y-2">
          {proposal.exclusions.map((e, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <input
                className="input"
                value={e}
                onChange={(ev) => setExclusion(idx, ev.target.value)}
              />
              <button
                type="button"
                className="mt-2 text-slate-400 hover:text-rose-600"
                onClick={() => removeExclusion(idx)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-secondary mt-4" onClick={addExclusion}>
          + Add exclusion
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">PDF preview &amp; download</h2>
            <p className="mt-1 text-sm text-slate-500">
              Generated as a multi-page PDF using @react-pdf/renderer.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowPreview((s) => !s)}
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
            <PDFDownloadLink
              document={
                <ProposalDocument
                  project={project}
                  proposal={proposal}
                  estimate={estimate}
                />
              }
              fileName={fileBaseName}
              className="btn-primary"
            >
              {/* @ts-expect-error - react-pdf types issue */}
              {({ loading }: { loading: boolean }) => (loading ? "Preparing…" : "Download PDF")}
            </PDFDownloadLink>
          </div>
        </div>
        {showPreview && (
          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            <PDFViewer style={{ width: "100%", height: 720, border: 0 }} showToolbar>
              <ProposalDocument
                project={project}
                proposal={proposal}
                estimate={estimate}
              />
            </PDFViewer>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn-primary" onClick={onContinue}>
          Continue to e-sign →
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
