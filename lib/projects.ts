import type {
  Estimate,
  ExtractionResult,
  LineItem,
  ProjectInfo,
  ProposalConfig,
  SignatureRequest,
} from "./types";

export type ProjectStatus =
  | "draft"
  | "sent"
  | "signed"
  | "in-progress"
  | "complete";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "draft",
  "sent",
  "signed",
  "in-progress",
  "complete",
];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
  "in-progress": "In progress",
  complete: "Complete",
};

export type StoredProject = {
  id: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  fileName: string | null;
  fileMimeType: string | null;
  hasFile: boolean;
  extraction: ExtractionResult | null;
  lineItems: LineItem[];
  project: ProjectInfo;
  proposal: ProposalConfig;
  estimate: Estimate;
  visualizationImage?: string | null;
  signature?: SignatureRequest | null;
};

const PROJECTS_KEY = "arias.projects.v1";
const FILE_KEY_PREFIX = "arias.project.file.v1.";

export function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `prj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function listProjects(): StoredProject[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECTS_KEY);
  const all = safeParse<StoredProject[]>(raw, []);
  return [...all].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getProject(id: string): StoredProject | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

function writeAll(projects: StoredProject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function saveProject(project: StoredProject) {
  if (typeof window === "undefined") return;
  const all = listProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  const next: StoredProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeAll(all);
}

export function deleteProject(id: string) {
  if (typeof window === "undefined") return;
  const all = listProjects().filter((p) => p.id !== id);
  writeAll(all);
  clearProjectFile(id);
}

export function updateProject(
  id: string,
  patch: Partial<StoredProject>,
): StoredProject | null {
  const existing = getProject(id);
  if (!existing) return null;
  const merged: StoredProject = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  saveProject(merged);
  return merged;
}

export function setProjectFile(
  id: string,
  payload: { fileName: string; mimeType: string; data: string } | null,
): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  const key = FILE_KEY_PREFIX + id;
  if (!payload) {
    window.localStorage.removeItem(key);
    return { ok: true };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export function getProjectFile(
  id: string,
): { fileName: string; mimeType: string; data: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(FILE_KEY_PREFIX + id);
  return safeParse<{ fileName: string; mimeType: string; data: string } | null>(
    raw,
    null,
  );
}

export function clearProjectFile(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FILE_KEY_PREFIX + id);
}

export function projectStats(p: StoredProject) {
  const lineCount = p.lineItems.length;
  const total = p.estimate.grandTotal;
  return { lineCount, total };
}
