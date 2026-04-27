import type { RateConfig, RateUnit } from "./rates";

export type ExtractedMeasurements = {
  drywall_sf: number;
  metal_framing_sf: number;
  taping_sf: number;
  corner_bead_lf: number;
  door_count: number;
  window_count: number;
  corner_count: number;
  /** Free-form items the model surfaced that don't fit a known measurement key. */
  other_items?: { description: string; quantity: number; unit: RateUnit }[];
  notes?: string;
};

export type ExtractionResult = {
  measurements: ExtractedMeasurements;
  summary: string;
  confidence: "low" | "medium" | "high";
  rawText?: string;
};

export type LineItem = {
  rateId: string;
  description: string;
  quantity: number;
  unit: RateUnit;
  laborRate: number;
  materialRate: number;
  laborTotal: number;
  materialTotal: number;
  total: number;
};

export type Estimate = {
  lineItems: LineItem[];
  laborSubtotal: number;
  materialSubtotal: number;
  grandTotal: number;
  generatedAt: string;
};

export type ExtractRequestPayload = {
  fileName: string;
  mimeType: string;
  /** Base64 (no data: prefix) */
  data: string;
};

export type ExtractApiResponse =
  | { ok: true; result: ExtractionResult }
  | { ok: false; error: string };

export type RateOverrides = Record<
  string,
  Partial<Pick<RateConfig, "laborRate" | "materialRate">>
>;

export type ProjectInfo = {
  projectName: string;
  projectAddress: string;
  clientName: string;
  clientCompany: string;
  generalContractor: string;
  preparedBy: string;
  proposalNumber: string;
  proposalDate: string;
  validForDays: number;
};

export type PaymentMilestone = {
  label: string;
  percent: number;
};

export type ProposalConfig = {
  scopeOfWork: string;
  exclusions: string[];
  paymentSchedule: PaymentMilestone[];
  notes: string;
};

export type SignatureStatus = "not_sent" | "sent" | "signed" | "declined";

export type SignatureRequest = {
  id: string;
  contractorEmail: string;
  clientEmail: string;
  signingUrl: string;
  status: SignatureStatus;
  createdAt: string;
  signedAt?: string;
};
