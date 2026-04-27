export type RateUnit = "SF" | "LF" | "EA";
export const RATE_UNITS: RateUnit[] = ["SF", "LF", "EA"];

// Trade categories for settings
export type TradeId = "drywall" | "framing" | "taping" | "acoustical" | "insulation";

export type Trade = {
  id: TradeId;
  label: string;
};

export const TRADES: Trade[] = [
  { id: "drywall", label: "Drywall" },
  { id: "framing", label: "Metal Framing" },
  { id: "taping", label: "Taping & Finishing" },
  { id: "acoustical", label: "Acoustical Ceilings" },
  { id: "insulation", label: "Insulation" },
];

export const TRADE_LABEL: Record<TradeId, string> = {
  drywall: "Drywall",
  framing: "Metal Framing",
  taping: "Taping & Finishing",
  acoustical: "Acoustical Ceilings",
  insulation: "Insulation",
};

export type RateCategory = "drywall" | "framing" | "finishing" | "trim" | "openings" | "other";

export type RateConfig = {
  id: string;
  description: string;
  unit: RateUnit;
  category: RateCategory;
  laborRate: number;
  materialRate: number;
  /** Maps an extracted measurement key (from Gemini) to this rate. */
  measurementKey: string;
  /** Associated trade */
  trade: Trade;
};

/**
 * Default rate book. Edit values here to tune pricing.
 * laborRate + materialRate = blended unit price applied to the extracted quantity.
 *
 * The placeholder rates from the spec collapse labor + material into a single number,
 * so we split them 60/40 (labor/material) as a reasonable starting estimate. Override
 * per line item as needed.
 */
export const DEFAULT_RATES: RateConfig[] = [
  {
    id: "drywall_hang_finish",
    description: "Drywall hang & finish",
    unit: "SF",
    category: "drywall",
    laborRate: 2.1,
    materialRate: 1.4,
    measurementKey: "drywall_sf",
    trade: TRADES[0],
  },
  {
    id: "metal_stud_framing",
    description: "Metal stud framing",
    unit: "SF",
    category: "framing",
    laborRate: 2.7,
    materialRate: 1.8,
    measurementKey: "metal_framing_sf",
    trade: TRADES[1],
  },
  {
    id: "taping_level_4",
    description: "Taping Level 4",
    unit: "SF",
    category: "finishing",
    laborRate: 0.7,
    materialRate: 0.3,
    measurementKey: "taping_sf",
    trade: TRADES[2],
  },
  {
    id: "corner_bead",
    description: "Corner bead",
    unit: "LF",
    category: "trim",
    laborRate: 2.1,
    materialRate: 1.4,
    measurementKey: "corner_bead_lf",
    trade: TRADES[2],
  },
  {
    id: "door_openings",
    description: "Door openings (frame-out)",
    unit: "EA",
    category: "openings",
    laborRate: 85,
    materialRate: 35,
    measurementKey: "door_count",
    trade: TRADES[1],
  },
  {
    id: "window_openings",
    description: "Window openings (frame-out)",
    unit: "EA",
    category: "openings",
    laborRate: 65,
    materialRate: 25,
    measurementKey: "window_count",
    trade: TRADES[1],
  },
];

export const MEASUREMENT_LABELS: Record<string, { label: string; unit: RateUnit }> = {
  drywall_sf: { label: "Drywall area (walls + ceilings)", unit: "SF" },
  metal_framing_sf: { label: "Metal stud framing", unit: "SF" },
  taping_sf: { label: "Tape & finish area", unit: "SF" },
  corner_bead_lf: { label: "Corner bead", unit: "LF" },
  door_count: { label: "Doors", unit: "EA" },
  window_count: { label: "Windows", unit: "EA" },
  corner_count: { label: "Corners (informational)", unit: "EA" },
};
