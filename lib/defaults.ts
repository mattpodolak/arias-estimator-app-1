import type { ProjectInfo, ProposalConfig } from "./types";

export const COMPANY = {
  name: "ARIAS INTERIOR SYSTEMS",
  tagline: "DRYWALL METAL FRAMING",
  license: "CA LIC #1107225",
  email: "estimating@ariasinteriorsystems.com",
  phone: "(XXX) XXX-XXXX",
  address: "Southern California",
  website: "www.ariasinteriorsystems.com",
  brand: "#0052CC",
};

export const DEFAULT_EXCLUSIONS: string[] = [
  "Permits, plan check, inspection fees",
  "Engineering, architectural, or structural design",
  "Insulation (thermal, acoustic, fire-rated batts)",
  "Painting, primer, sealers, and wall coverings",
  "Fire-rated penetrations / firestopping",
  "Acoustic ceiling tile (T-bar) systems",
  "Wood framing, blocking, or carpentry",
  "Plumbing, electrical, mechanical, and low-voltage",
  "Demolition, abatement, or hazardous material handling",
  "Flooring, base, or finish trim",
  "Hoisting, scaffolding above 12 feet",
  "Final cleaning beyond reasonable broom-clean",
  "Overtime, premium, or shift work unless requested",
  "Bonds, prevailing wage, or certified payroll unless noted",
];

export const DEFAULT_PAYMENT_SCHEDULE: { label: string; percent: number }[] = [
  { label: "Mobilization / contract signing", percent: 25 },
  { label: "Framing complete", percent: 25 },
  { label: "Drywall hung", percent: 25 },
  { label: "Final completion & punchlist", percent: 25 },
];

export function defaultProjectInfo(): ProjectInfo {
  const today = new Date().toISOString().slice(0, 10);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(2, 12);
  return {
    projectName: "",
    projectAddress: "",
    clientName: "",
    clientCompany: "",
    generalContractor: "",
    preparedBy: "Arias Interior Systems",
    proposalNumber: `AIS-${stamp}`,
    proposalDate: today,
    validForDays: 30,
  };
}

export function defaultProposalConfig(): ProposalConfig {
  return {
    scopeOfWork:
      "Furnish all labor, materials, equipment, and supervision necessary to install metal stud framing, drywall, taping, and finishing per the plans and specifications referenced in this proposal. Work to be performed in accordance with applicable building codes and industry standards.",
    exclusions: [...DEFAULT_EXCLUSIONS],
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE.map((m) => ({ ...m })),
    notes: "",
  };
}
