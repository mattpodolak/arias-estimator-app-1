"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Timeline } from "@/components/project-detail/Timeline";
import { PhotoGallery } from "@/components/project-detail/PhotoGallery";
import { DailyLogs } from "@/components/project-detail/DailyLogs";
import { RfiList } from "@/components/project-detail/RfiList";
import { PunchList } from "@/components/project-detail/PunchList";
import { formatCurrency } from "@/lib/estimate";
import {
  STATUS_LABEL,
  getProject,
  updateProject,
  type ProjectStatus,
  type StoredProject,
} from "@/lib/projects";
import {
  buildDefaultTimeline,
  todayIso,
  type DailyLog,
  type Milestone,
  type PhotoEntry,
  type PunchItem,
  type Rfi,
} from "@/lib/phase2";

type TabKey =
  | "overview"
  | "timeline"
  | "photos"
  | "logs"
  | "rfis"
  | "punch"
  | "emails";

const TABS: { id: TabKey; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "photos", label: "Photos" },
  { id: "logs", label: "Daily Logs" },
  { id: "rfis", label: "RFIs" },
  { id: "punch", label: "Punch List" },
  { id: "emails", label: "Email History" },
];

const STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-arias-50 text-arias-700",
  signed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-800",
  complete: "bg-violet-100 text-violet-700",
};

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<StoredProject | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    setProject(getProject(params.projectId));
    setLoaded(true);
  }, [params.projectId]);

  function patch(patch: Partial<StoredProject>) {
    if (!project) return;
    const updated = updateProject(project.id, patch);
    if (updated) setProject(updated);
  }

  const counts = useMemo(() => {
    if (!project) return null;
    const punchOpen = (project.punchItems ?? []).filter(
      (p) => p.status !== "complete",
    ).length;
    const rfiOpen = (project.rfis ?? []).filter((r) => r.status === "open")
      .length;
    return {
      photos: (project.photos ?? []).length,
      logs: (project.dailyLogs ?? []).length,
      rfis: (project.rfis ?? []).length,
      rfiOpen,
      punch: (project.punchItems ?? []).length,
      punchOpen,
      emails: (project.emailHistory ?? []).length,
    };
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
        <Header />
        <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">Project not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              We couldn't find that project on this device.
            </p>
            <div className="mt-4">
              <Link href="/projects" className="btn-secondary text-xs">
                Back to projects
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const { project: info, status, estimate } = project;
  const timeline = project.timeline ?? buildDefaultTimeline(todayIso());

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-4 text-xs text-slate-500">
          <Link href="/projects" className="hover:underline">
            ← Projects
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {info.projectName || "Untitled project"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {info.projectAddress || "No address"} ·{" "}
                {info.clientName || "No client"}
                {info.clientCompany ? ` · ${info.clientCompany}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={["badge", STATUS_BADGE[status]].join(" ")}>
                {STATUS_LABEL[status]}
              </span>
              <Link
                href={`/?projectId=${encodeURIComponent(project.id)}`}
                className="btn-ghost text-xs"
              >
                Open in estimator
              </Link>
              <Link
                href={`/portal/${encodeURIComponent(project.id)}`}
                target="_blank"
                className="btn-secondary text-xs"
              >
                Open client portal ↗
              </Link>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-4">
            <Stat label="Total" value={formatCurrency(estimate.grandTotal || 0)} accent />
            <Stat label="Lines" value={String(project.lineItems.length)} />
            <Stat
              label="Open RFIs"
              value={String(counts?.rfiOpen ?? 0)}
            />
            <Stat
              label="Punch open"
              value={String(counts?.punchOpen ?? 0)}
            />
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap gap-1 rounded-md bg-slate-100 p-1">
          {TABS.map((t) => {
            const badge =
              t.id === "photos"
                ? counts?.photos
                : t.id === "logs"
                  ? counts?.logs
                  : t.id === "rfis"
                    ? counts?.rfis
                    : t.id === "punch"
                      ? counts?.punch
                      : t.id === "emails"
                        ? counts?.emails
                        : null;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-white text-arias-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {badge !== null && badge !== undefined && badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-600">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "overview" && <Overview project={project} />}
          {tab === "timeline" && (
            <Timeline
              milestones={timeline}
              onChange={(next: Milestone[]) => patch({ timeline: next })}
            />
          )}
          {tab === "photos" && (
            <PhotoGallery
              photos={project.photos}
              onChange={(next: PhotoEntry[]) => patch({ photos: next })}
            />
          )}
          {tab === "logs" && (
            <DailyLogs
              logs={project.dailyLogs}
              onChange={(next: DailyLog[]) => patch({ dailyLogs: next })}
            />
          )}
          {tab === "rfis" && (
            <RfiList
              rfis={project.rfis}
              onChange={(next: Rfi[]) => patch({ rfis: next })}
            />
          )}
          {tab === "punch" && (
            <PunchList
              items={project.punchItems}
              photos={project.photos}
              onChangeItems={(next: PunchItem[]) =>
                patch({ punchItems: next })
              }
              onChangePhotos={(next: PhotoEntry[]) => patch({ photos: next })}
            />
          )}
          {tab === "emails" && <EmailHistory project={project} />}
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Overview({ project }: { project: StoredProject }) {
  const milestones = project.timeline ?? [];
  const recentLogs = (project.dailyLogs ?? [])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);
  const openPunch = (project.punchItems ?? []).filter(
    (p) => p.status !== "complete",
  ).length;
  const totalPunch = (project.punchItems ?? []).length;
  const openRfis = (project.rfis ?? []).filter((r) => r.status === "open")
    .length;

  const completedMs = milestones.filter((m) => m.status === "complete").length;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900">Schedule</h3>
        {milestones.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No timeline yet. Open the Timeline tab to set milestones.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500">
              {completedMs} of {milestones.length} milestones complete.
            </p>
            <ul className="mt-3 space-y-2">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-block h-2 w-2 rounded-full",
                        m.status === "complete"
                          ? "bg-emerald-500"
                          : m.status === "in-progress"
                            ? "bg-amber-400"
                            : "bg-slate-300",
                      ].join(" ")}
                    />
                    <span className="font-medium text-slate-700">{m.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(m.startDate + "T00:00:00").toLocaleDateString()}
                    {" – "}
                    {new Date(m.endDate + "T00:00:00").toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900">At a glance</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <Row
            label="Photos"
            value={`${(project.photos ?? []).length} uploaded`}
          />
          <Row
            label="Daily logs"
            value={`${(project.dailyLogs ?? []).length} entries`}
          />
          <Row
            label="RFIs"
            value={`${openRfis} open / ${(project.rfis ?? []).length} total`}
          />
          <Row
            label="Punch items"
            value={`${openPunch} open / ${totalPunch} total`}
          />
          <Row
            label="Emails sent"
            value={`${(project.emailHistory ?? []).length}`}
          />
        </ul>
      </div>

      <div className="card p-6 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900">Recent logs</h3>
        {recentLogs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No daily logs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recentLogs.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {new Date(l.date + "T00:00:00").toLocaleDateString()}
                  </span>
                  <span className="text-xs text-slate-500">
                    Crew: {l.crewCount || "—"} · {l.weather || "—"}
                  </span>
                </div>
                {l.workPerformed && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {l.workPerformed}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmailHistory({ project }: { project: StoredProject }) {
  const list = (project.emailHistory ?? [])
    .slice()
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
  if (list.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        No emails sent yet. Use <span className="font-medium">Send Proposal</span>{" "}
        on the proposal step to deliver the PDF.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Sent</th>
            <th className="px-3 py-2 text-left">To</th>
            <th className="px-3 py-2 text-left">Subject</th>
            <th className="px-3 py-2 text-left">Attachment</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2 text-xs text-slate-500">
                {new Date(e.sentAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-slate-800">{e.to}</td>
              <td className="px-3 py-2 text-slate-700">{e.subject}</td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {e.attachmentName ?? "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={[
                    "badge",
                    e.status === "sent"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700",
                  ].join(" ")}
                >
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
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
          "mt-1 text-lg font-semibold tabular-nums",
          accent ? "text-arias-700" : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </li>
  );
}
