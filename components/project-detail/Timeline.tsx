"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  addDaysIso,
  buildDefaultTimeline,
  diffDays,
  todayIso,
  type Milestone,
  type MilestoneId,
} from "@/lib/phase2";

const STATUS_COLOR: Record<Milestone["status"], string> = {
  "not-started": "bg-slate-300",
  "in-progress": "bg-amber-400",
  complete: "bg-emerald-500",
};

const STATUS_LABEL: Record<Milestone["status"], string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
};

export function Timeline({
  milestones,
  onChange,
}: {
  milestones: Milestone[] | undefined;
  onChange: (next: Milestone[]) => void;
}) {
  const list = useMemo<Milestone[]>(() => {
    if (milestones && milestones.length > 0) return milestones;
    return buildDefaultTimeline(todayIso());
  }, [milestones]);

  // Visible window: pad 7 days on each side of min/max
  const { rangeStart, rangeDays } = useMemo(() => {
    const starts = list.map((m) => m.startDate).sort();
    const ends = list.map((m) => m.endDate).sort();
    const minD = starts[0] ?? todayIso();
    const maxD = ends[ends.length - 1] ?? addDaysIso(minD, 90);
    const start = addDaysIso(minD, -7);
    const days = Math.max(30, diffDays(start, maxD) + 14);
    return { rangeStart: start, rangeDays: days };
  }, [list]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | null
    | {
        id: MilestoneId;
        kind: "move" | "left" | "right";
        startX: number;
        startStart: string;
        startEnd: string;
      }
  >(null);

  function pxPerDay(): number {
    const w = trackRef.current?.clientWidth ?? 800;
    return w / rangeDays;
  }

  function startDrag(
    e: React.PointerEvent,
    m: Milestone,
    kind: "move" | "left" | "right",
  ) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: m.id,
      kind,
      startX: e.clientX,
      startStart: m.startDate,
      startEnd: m.endDate,
    });
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const ppd = pxPerDay();
    if (ppd <= 0) return;
    const dxDays = Math.round((e.clientX - drag.startX) / ppd);
    const next = list.map((m) => {
      if (m.id !== drag.id) return m;
      if (drag.kind === "move") {
        return {
          ...m,
          startDate: addDaysIso(drag.startStart, dxDays),
          endDate: addDaysIso(drag.startEnd, dxDays),
        };
      }
      if (drag.kind === "left") {
        const ns = addDaysIso(drag.startStart, dxDays);
        if (diffDays(ns, drag.startEnd) < 0) return m;
        return { ...m, startDate: ns };
      }
      if (drag.kind === "right") {
        const ne = addDaysIso(drag.startEnd, dxDays);
        if (diffDays(drag.startStart, ne) < 0) return m;
        return { ...m, endDate: ne };
      }
      return m;
    });
    onChange(next);
  }

  function endDrag() {
    setDrag(null);
  }

  function patchMilestone(id: MilestoneId, patch: Partial<Milestone>) {
    onChange(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  const today = todayIso();
  const todayOffset = diffDays(rangeStart, today);
  const ppdPct = (offsetDays: number) => (offsetDays / rangeDays) * 100;

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Schedule</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Drag a bar to shift dates, or grab an edge to resize.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => onChange(buildDefaultTimeline(todayIso()))}
          >
            Reset schedule
          </button>
        </div>

        <div
          ref={trackRef}
          className="relative mt-4 select-none rounded-md border border-slate-200 bg-slate-50/60"
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="grid grid-cols-12 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
            {Array.from({ length: 12 }).map((_, i) => {
              const d = addDaysIso(
                rangeStart,
                Math.round((rangeDays / 12) * i),
              );
              return (
                <div key={i} className="px-1 py-1 text-center">
                  {new Date(d + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              );
            })}
          </div>

          {todayOffset >= 0 && todayOffset <= rangeDays && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-arias/70"
              style={{ left: `${ppdPct(todayOffset)}%` }}
            >
              <div className="absolute -top-3 left-1 text-[10px] font-medium uppercase tracking-wider text-arias">
                Today
              </div>
            </div>
          )}

          <div className="relative">
            {list.map((m, i) => {
              const startOffset = diffDays(rangeStart, m.startDate);
              const span = Math.max(1, diffDays(m.startDate, m.endDate) + 1);
              return (
                <div
                  key={m.id}
                  className="relative flex h-12 items-center border-b border-slate-100 last:border-b-0"
                >
                  <div className="absolute left-2 z-10 max-w-[140px] truncate text-xs font-medium text-slate-700">
                    {i + 1}. {m.label}
                  </div>
                  <div className="absolute inset-0">
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => startDrag(e, m, "move")}
                      className={[
                        "absolute top-2 bottom-2 cursor-grab rounded-md text-[11px] font-medium text-white shadow-sm",
                        "flex items-center justify-center",
                        STATUS_COLOR[m.status],
                        drag?.id === m.id ? "cursor-grabbing ring-2 ring-arias" : "",
                      ].join(" ")}
                      style={{
                        left: `${ppdPct(startOffset)}%`,
                        width: `${ppdPct(span)}%`,
                        minWidth: 30,
                      }}
                    >
                      <span
                        onPointerDown={(e) => startDrag(e, m, "left")}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-md bg-black/10"
                      />
                      <span className="px-2 text-center">
                        {span}d
                      </span>
                      <span
                        onPointerDown={(e) => startDrag(e, m, "right")}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-md bg-black/10"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Milestones
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Milestone</th>
                <th className="px-3 py-2 text-left">Start</th>
                <th className="px-3 py-2 text-left">End</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {m.label}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="input"
                      value={m.startDate}
                      onChange={(e) => {
                        const ns = e.target.value;
                        patchMilestone(m.id, {
                          startDate: ns,
                          endDate:
                            diffDays(ns, m.endDate) < 0 ? ns : m.endDate,
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="input"
                      value={m.endDate}
                      onChange={(e) => {
                        const ne = e.target.value;
                        patchMilestone(m.id, {
                          endDate: ne,
                          startDate:
                            diffDays(m.startDate, ne) < 0 ? ne : m.startDate,
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {diffDays(m.startDate, m.endDate) + 1} days
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input"
                      value={m.status}
                      onChange={(e) =>
                        patchMilestone(m.id, {
                          status: e.target.value as Milestone["status"],
                        })
                      }
                    >
                      {(Object.keys(STATUS_LABEL) as Milestone["status"][]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ),
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
