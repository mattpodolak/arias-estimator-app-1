/**
 * Phase 2 entity types: timeline milestones, photos, daily logs, RFIs, punch list,
 * email history. All persisted within StoredProject in localStorage.
 */

export type MilestoneId =
  | "mobilization"
  | "rough-in"
  | "inspection"
  | "finish"
  | "punch"
  | "complete";

export type Milestone = {
  id: MilestoneId;
  label: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  status: "not-started" | "in-progress" | "complete";
  notes?: string;
};

export const DEFAULT_MILESTONES: Omit<Milestone, "startDate" | "endDate">[] = [
  { id: "mobilization", label: "Mobilization", status: "not-started" },
  { id: "rough-in", label: "Rough-in", status: "not-started" },
  { id: "inspection", label: "Inspection", status: "not-started" },
  { id: "finish", label: "Finish", status: "not-started" },
  { id: "punch", label: "Punch", status: "not-started" },
  { id: "complete", label: "Complete", status: "not-started" },
];

export type PhotoEntry = {
  id: string;
  /** data URL */
  dataUrl: string;
  description: string;
  tags: string[];
  capturedAt: string; // ISO datetime
  uploadedAt: string; // ISO datetime
};

export type DailyLog = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  weather: string;
  crewCount: number;
  workPerformed: string;
  issues: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RfiStatus = "open" | "answered" | "closed";

export type Rfi = {
  id: string;
  number: string;
  subject: string;
  to: string;
  question: string;
  dateSent: string;
  dateDue: string;
  status: RfiStatus;
  response: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PunchStatus = "open" | "in-progress" | "complete";

export type PunchItem = {
  id: string;
  location: string;
  description: string;
  assignedTo: string;
  status: PunchStatus;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type EmailRecord = {
  id: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  attachmentName?: string;
  sentAt: string;
  status: "sent" | "failed";
};

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function buildDefaultTimeline(start = todayIso()): Milestone[] {
  // Spread the six milestones across 90 days, each ~15 days
  const base = new Date(start + "T00:00:00").getTime();
  const dur = 15;
  return DEFAULT_MILESTONES.map((m, idx) => {
    const startD = new Date(base + idx * dur * 86400000)
      .toISOString()
      .slice(0, 10);
    const endD = addDaysIso(startD, dur - 1);
    return {
      ...m,
      startDate: startD,
      endDate: endD,
    } as Milestone;
  });
}
