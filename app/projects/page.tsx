"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatCurrency } from "@/lib/estimate";
import {
  PROJECT_STATUSES,
  STATUS_LABEL,
  deleteProject,
  listProjects,
  type ProjectStatus,
  type StoredProject,
} from "@/lib/projects";

const STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-arias-50 text-arias-700",
  signed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-800",
  complete: "bg-violet-100 text-violet-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

  useEffect(() => {
    setProjects(listProjects());
    setLoaded(true);
  }, []);

  function refresh() {
    setProjects(listProjects());
  }

  function onDelete(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    deleteProject(id);
    refresh();
  }

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const totals = useMemo(() => {
    const grand = projects.reduce((s, p) => s + (p.estimate.grandTotal || 0), 0);
    const byStatus: Record<string, number> = {};
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }
    return { count: projects.length, grand, byStatus };
  }, [projects]);

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              All saved estimates. Click any row to open it in the estimator.
            </p>
          </div>
          <Link href="/" className="btn-primary">
            + New project
          </Link>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total projects" value={totals.count.toString()} />
          <SummaryCard
            label="Pipeline value"
            value={formatCurrency(totals.grand)}
          />
          <SummaryCard
            label="Signed"
            value={(totals.byStatus.signed || 0).toString()}
          />
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <button
              type="button"
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                filter === "all"
                  ? "bg-arias text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              ].join(" ")}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  filter === s
                    ? "bg-arias text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
                onClick={() => setFilter(s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Project</th>
                  <th className="px-3 py-3 text-left font-semibold">Client</th>
                  <th className="px-3 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Lines</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-left font-semibold">Updated</th>
                  <th className="w-32 px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loaded ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Loading projects…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {projects.length === 0 ? (
                        <>
                          No projects yet.{" "}
                          <Link
                            href="/"
                            className="font-medium text-arias-700 hover:underline"
                          >
                            Create your first one →
                          </Link>
                        </>
                      ) : (
                        <>No projects match the current filter.</>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/?projectId=${encodeURIComponent(p.id)}`}
                          className="font-medium text-slate-900 hover:text-arias-700"
                        >
                          {p.project.projectName || "Untitled project"}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {p.project.projectAddress || "No address"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <div>{p.project.clientName || "—"}</div>
                        <div className="text-xs text-slate-500">
                          {p.project.clientCompany}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={["badge", STATUS_BADGE[p.status]].join(" ")}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                        {p.lineItems.length}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(p.estimate.grandTotal || 0)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {new Date(p.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/?projectId=${encodeURIComponent(p.id)}`}
                            className="rounded-md px-2 py-1 text-xs text-arias-700 hover:bg-arias-50"
                          >
                            Open
                          </Link>
                          <Link
                            href={`/portal/${encodeURIComponent(p.id)}`}
                            className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            target="_blank"
                          >
                            Portal
                          </Link>
                          <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => onDelete(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
