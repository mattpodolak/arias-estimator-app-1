"use client";

import React, { useMemo } from "react";
import { formatCurrency, formatNumber } from "@/lib/estimate";
import type { ExtractionResult, LineItem } from "@/lib/types";
import type { RateUnit } from "@/lib/rates";

const round2 = (n: number) => Math.round(n * 100) / 100;

function recomputeLine(li: LineItem): LineItem {
  const laborTotal = round2(li.quantity * li.laborRate);
  const materialTotal = round2(li.quantity * li.materialRate);
  return {
    ...li,
    laborTotal,
    materialTotal,
    total: round2(laborTotal + materialTotal),
  };
}

export function EstimateStep({
  fileName,
  extraction,
  lineItems,
  setLineItems,
  onBack,
  onContinue,
}: {
  fileName: string | null;
  extraction: ExtractionResult | null;
  lineItems: LineItem[];
  setLineItems: (v: LineItem[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const totals = useMemo(() => {
    const laborSubtotal = round2(lineItems.reduce((s, l) => s + l.laborTotal, 0));
    const materialSubtotal = round2(lineItems.reduce((s, l) => s + l.materialTotal, 0));
    return {
      laborSubtotal,
      materialSubtotal,
      grandTotal: round2(laborSubtotal + materialSubtotal),
    };
  }, [lineItems]);

  function update(idx: number, patch: Partial<LineItem>) {
    setLineItems(
      lineItems.map((li, i) => (i === idx ? recomputeLine({ ...li, ...patch }) : li)),
    );
  }

  function remove(idx: number) {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  }

  function addLine() {
    setLineItems([
      ...lineItems,
      recomputeLine({
        rateId: `custom_${Date.now()}`,
        description: "Custom line item",
        quantity: 0,
        unit: "EA",
        laborRate: 0,
        materialRate: 0,
        laborTotal: 0,
        materialTotal: 0,
        total: 0,
      }),
    ]);
  }

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Estimate</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quantities and rates are pre-filled from the AI extraction. Edit any value
              before continuing.
            </p>
          </div>
          {extraction && (
            <span
              className={[
                "badge",
                extraction.confidence === "high"
                  ? "bg-emerald-100 text-emerald-700"
                  : extraction.confidence === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700",
              ].join(" ")}
            >
              {extraction.confidence.toUpperCase()} confidence
            </span>
          )}
        </div>

        {extraction && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {extraction.summary && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan summary
                </div>
                <p className="mt-1 leading-relaxed">{extraction.summary}</p>
                {fileName && (
                  <p className="mt-2 text-xs text-slate-500">Source: {fileName}</p>
                )}
              </div>
            )}
            {extraction.measurements.notes && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Assumptions
                </div>
                <p className="mt-1 leading-relaxed">{extraction.measurements.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-3 py-3 text-right font-semibold">Qty</th>
                <th className="px-3 py-3 text-left font-semibold">Unit</th>
                <th className="px-3 py-3 text-right font-semibold">Labor</th>
                <th className="px-3 py-3 text-right font-semibold">Material</th>
                <th className="px-3 py-3 text-right font-semibold">Ext. price</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No line items yet. Click <em>Add line item</em> below to add one.
                  </td>
                </tr>
              )}
              {lineItems.map((li, idx) => (
                <tr key={li.rateId} className="align-top">
                  <td className="px-4 py-2">
                    <input
                      className="input"
                      value={li.description}
                      onChange={(e) => update(idx, { description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input text-right"
                      value={li.quantity}
                      onChange={(e) =>
                        update(idx, { quantity: round2(Number(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input"
                      value={li.unit}
                      onChange={(e) => update(idx, { unit: e.target.value as RateUnit })}
                    >
                      <option>SF</option>
                      <option>LF</option>
                      <option>EA</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <RateInput
                      value={li.laborRate}
                      onChange={(v) => update(idx, { laborRate: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <RateInput
                      value={li.materialRate}
                      onChange={(v) => update(idx, { materialRate: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                    {formatCurrency(li.total)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-rose-600"
                      title="Remove line"
                      onClick={() => remove(idx)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 text-sm">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right text-slate-500">
                  Labor subtotal
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatCurrency(totals.laborSubtotal)}
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right text-slate-500">
                  Material subtotal
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatCurrency(totals.materialSubtotal)}
                </td>
                <td />
              </tr>
              <tr className="border-t border-slate-200">
                <td colSpan={5} className="px-4 py-3 text-right text-base font-semibold text-slate-900">
                  Grand total
                </td>
                <td className="px-3 py-3 text-right text-base font-bold tabular-nums text-arias-700">
                  {formatCurrency(totals.grandTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <button type="button" className="btn-secondary" onClick={addLine}>
            + Add line item
          </button>
          <span>
            {lineItems.length} line item{lineItems.length === 1 ? "" : "s"} ·{" "}
            {formatNumber(
              lineItems.reduce((s, l) => s + (l.unit === "EA" ? 0 : l.quantity), 0),
            )}{" "}
            measured units (SF/LF)
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onContinue}
          disabled={lineItems.length === 0 || totals.grandTotal <= 0}
        >
          Continue to proposal →
        </button>
      </div>
    </section>
  );
}

function RateInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">
        $
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        className="input pl-5 text-right"
        value={value}
        onChange={(e) => onChange(round2(Number(e.target.value) || 0))}
      />
    </div>
  );
}
