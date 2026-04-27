import { DEFAULT_RATES, type RateConfig } from "./rates";
import type { Estimate, ExtractedMeasurements, LineItem, RateOverrides } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function applyOverrides(rates: RateConfig[], overrides: RateOverrides): RateConfig[] {
  return rates.map((r) => {
    const o = overrides[r.id];
    if (!o) return r;
    return {
      ...r,
      laborRate: o.laborRate ?? r.laborRate,
      materialRate: o.materialRate ?? r.materialRate,
    };
  });
}

export function buildEstimate(
  measurements: ExtractedMeasurements,
  rates: RateConfig[] = DEFAULT_RATES,
): Estimate {
  const lineItems: LineItem[] = [];

  for (const rate of rates) {
    const qty = Number(
      (measurements as unknown as Record<string, number>)[rate.measurementKey] ?? 0,
    );
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const laborTotal = round2(qty * rate.laborRate);
    const materialTotal = round2(qty * rate.materialRate);

    lineItems.push({
      rateId: rate.id,
      description: rate.description,
      quantity: round2(qty),
      unit: rate.unit,
      laborRate: rate.laborRate,
      materialRate: rate.materialRate,
      laborTotal,
      materialTotal,
      total: round2(laborTotal + materialTotal),
    });
  }

  const laborSubtotal = round2(lineItems.reduce((s, li) => s + li.laborTotal, 0));
  const materialSubtotal = round2(lineItems.reduce((s, li) => s + li.materialTotal, 0));

  return {
    lineItems,
    laborSubtotal,
    materialSubtotal,
    grandTotal: round2(laborSubtotal + materialSubtotal),
    generatedAt: new Date().toISOString(),
  };
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
