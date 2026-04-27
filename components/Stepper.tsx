import React from "react";

export type StepKey = "upload" | "estimate" | "proposal" | "sign";

export const STEPS: { key: StepKey; label: string; subtitle: string }[] = [
  { key: "upload", label: "Upload Plans", subtitle: "PDF or images" },
  { key: "estimate", label: "Estimate", subtitle: "Review quantities & rates" },
  { key: "proposal", label: "Proposal", subtitle: "Generate PDF" },
  { key: "sign", label: "E-Sign", subtitle: "Send for signature" },
];

export function Stepper({
  current,
  onSelect,
  reachable,
}: {
  current: StepKey;
  onSelect?: (key: StepKey) => void;
  reachable: Record<StepKey, boolean>;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex w-full items-center gap-2">
      {STEPS.map((step, idx) => {
        const isCurrent = idx === currentIdx;
        const isDone = idx < currentIdx;
        const canClick = !!onSelect && reachable[step.key];
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelect?.(step.key)}
              className={[
                "flex flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
                isCurrent
                  ? "border-arias bg-arias-50/60 shadow-sm"
                  : isDone
                    ? "border-arias-100 bg-white"
                    : "border-slate-200 bg-white/60",
                canClick ? "hover:border-arias-200" : "cursor-default",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent
                    ? "bg-arias text-white"
                    : isDone
                      ? "bg-arias-100 text-arias-700"
                      : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={[
                    "block truncate text-sm font-semibold",
                    isCurrent ? "text-arias-700" : "text-slate-700",
                  ].join(" ")}
                >
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {step.subtitle}
                </span>
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <span className="hidden h-px w-4 bg-slate-200 sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
