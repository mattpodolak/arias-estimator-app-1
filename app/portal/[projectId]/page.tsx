"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/defaults";
import { formatCurrency } from "@/lib/estimate";
import {
  STATUS_LABEL,
  getProject,
  type ProjectStatus,
  type StoredProject,
} from "@/lib/projects";
import { ProposalDocument } from "@/components/ProposalDocument";
import { Logo } from "@/components/Logo";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="btn-primary">Preparing PDF…</span> },
);

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading proposal preview…
      </div>
    ),
  },
);

const STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-arias-50 text-arias-700",
  signed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-800",
  complete: "bg-violet-100 text-violet-700",
};

export default function PortalPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<StoredProject | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProject(getProject(params.projectId));
    setLoaded(true);
  }, [params.projectId]);

  const fileBaseName = useMemo(() => {
    if (!project) return "proposal.pdf";
    return (
      (project.project.proposalNumber || "ARIAS-PROPOSAL").replace(
        /[^A-Za-z0-9_-]+/g,
        "_",
      ) + ".pdf"
    );
  }, [project]);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen flex-col">
        <PortalHeader />
        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">Project not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              We couldn't find a project with that link on this device. The portal
              currently uses local browser storage — open the link from the device the
              project was created on.
            </p>
            <div className="mt-4">
              <Link href="/projects" className="btn-secondary text-xs">
                Back to projects
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { project: info, proposal, estimate, status, signature } = project;
  const signedAlready = signature?.status === "signed" || status === "signed";

  return (
    <main className="flex min-h-screen flex-col">
      <PortalHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Client portal
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {info.projectName || "Proposal"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {info.projectAddress || ""}
              </p>
            </div>
            <span className={["badge", STATUS_BADGE[status]].join(" ")}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <Field label="Proposal #" value={info.proposalNumber || "—"} />
            <Field
              label="Prepared for"
              value={
                info.clientName +
                (info.clientCompany ? ` · ${info.clientCompany}` : "")
              }
            />
            <Field
              label="Total"
              value={formatCurrency(estimate.grandTotal || 0)}
              accent
            />
          </dl>
        </div>

        <div className="mt-6 card p-6">
          <h2 className="text-base font-semibold text-slate-900">Proposal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the full proposal below or download a copy.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PDFDownloadLink
              document={
                <ProposalDocument
                  project={info}
                  proposal={proposal}
                  estimate={estimate}
                />
              }
              fileName={fileBaseName}
              className="btn-primary text-xs"
            >
              Download PDF
            </PDFDownloadLink>
            {signature?.signingUrl && !signedAlready && (
              <a
                href={signature.signingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                Sign proposal →
              </a>
            )}
            {signedAlready && (
              <span className="badge bg-emerald-100 text-emerald-700">
                Signed{signature?.signedAt
                  ? ` · ${new Date(signature.signedAt).toLocaleDateString()}`
                  : ""}
              </span>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            <PDFViewer style={{ width: "100%", height: 720, border: 0 }} showToolbar>
              <ProposalDocument
                project={info}
                proposal={proposal}
                estimate={estimate}
              />
            </PDFViewer>
          </div>
        </div>

        {project.visualizationImage && (
          <div className="mt-6 card p-6">
            <h2 className="text-base font-semibold text-slate-900">
              3D Visualization
            </h2>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.visualizationImage}
                alt="3D visualization"
                className="block h-auto w-full"
              />
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          {COMPANY.name} · {COMPANY.tagline} · {COMPANY.license}
        </div>
      </div>
    </main>
  );
}

function PortalHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Logo />
        <span className="text-xs uppercase tracking-wider text-slate-500">
          Client Portal
        </span>
      </div>
    </header>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd
        className={[
          "mt-1 text-sm font-semibold",
          accent ? "text-arias-700" : "text-slate-900",
        ].join(" ")}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
