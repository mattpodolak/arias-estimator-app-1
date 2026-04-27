import type { ExtractionResult } from "@/lib/types";
import type { RateUnit } from "@/lib/rates";
import { RATE_UNITS } from "@/lib/rates";

export function emptyResult(notes: string): ExtractionResult {
  return {
    measurements: {
      detectedTrades: [],
      quantities: {},
      lineItems: [],
      notes,
    },
    summary: "",
    confidence: "low",
  };
}

export function parseModelJson(text: string): ExtractionResult | null {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0 || end < start) return null;
  const json = cleaned.slice(start, end + 1);
  try {
    return normalizeExtraction(JSON.parse(json), text);
  } catch {
    return null;
  }
}

function coerceUnit(value: unknown): RateUnit {
  const s = String(value ?? "").toUpperCase();
  return (RATE_UNITS as string[]).includes(s) ? (s as RateUnit) : "EA";
}

// Legacy fields the old prompt produced; lift into quantities for backward compat.
const LEGACY_QUANTITY_FIELDS = [
  "drywall_sf",
  "metal_framing_sf",
  "taping_sf",
  "corner_bead_lf",
  "window_count",
] as const;

export function normalizeExtraction(
  parsed: unknown,
  rawText?: string,
): ExtractionResult | null {
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  const measurementsObj = (root.measurements as Record<string, unknown>) ?? {};
  // Accept top-level OR nested under "measurements".
  const m = measurementsObj && Object.keys(measurementsObj).length > 0 ? measurementsObj : root;

  const quantitiesRaw = (m.quantities as Record<string, unknown>) ?? {};
  const quantities: Record<string, number> = {};
  for (const [k, v] of Object.entries(quantitiesRaw)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) quantities[k] = n;
  }
  for (const k of LEGACY_QUANTITY_FIELDS) {
    const n = Number((m as Record<string, unknown>)[k]);
    if (Number.isFinite(n) && n > 0 && !(k in quantities)) {
      quantities[k] = n;
    }
  }
  // Map legacy generic door_count → interior_door_count.
  const legacyDoor = Number((m as Record<string, unknown>).door_count);
  if (
    Number.isFinite(legacyDoor) &&
    legacyDoor > 0 &&
    !("interior_door_count" in quantities)
  ) {
    quantities.interior_door_count = legacyDoor;
  }

  const lineItemsRaw =
    (m.lineItems as unknown[]) ?? (m.other_items as unknown[]) ?? [];
  const lineItems = Array.isArray(lineItemsRaw)
    ? lineItemsRaw
        .map((raw) => {
          const it = (raw ?? {}) as {
            description?: unknown;
            quantity?: unknown;
            unit?: unknown;
            trade?: unknown;
            rateId?: unknown;
          };
          return {
            description: String(it.description ?? "").trim(),
            quantity: Number(it.quantity) || 0,
            unit: coerceUnit(it.unit),
            trade: typeof it.trade === "string" ? it.trade : undefined,
            rateId: typeof it.rateId === "string" ? it.rateId : undefined,
          };
        })
        .filter((it) => it.description && it.quantity > 0)
    : [];

  const detectedTradesRaw = (root.detectedTrades ?? m.detectedTrades) as unknown;
  const detectedTrades = Array.isArray(detectedTradesRaw)
    ? detectedTradesRaw.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];

  const notes = typeof m.notes === "string" ? m.notes : "";

  return {
    measurements: {
      detectedTrades,
      quantities,
      lineItems,
      notes,
    },
    summary: typeof root.summary === "string" ? root.summary : "",
    confidence:
      root.confidence === "high" || root.confidence === "medium"
        ? root.confidence
        : "low",
    rawText,
  };
}
