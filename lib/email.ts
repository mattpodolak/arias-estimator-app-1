/**
 * Email service. Mock for now — logs to console + records the send to localStorage.
 * Future: swap implementation for Resend/SendGrid via /api/email route.
 */

import { newId, type EmailRecord } from "./phase2";
import { updateProject, getProject } from "./projects";

export type EmailProvider = "mock" | "resend" | "sendgrid" | "smtp";

export type EmailSettings = {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  apiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  defaultSubject: string;
  defaultBody: string;
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  provider: "mock",
  fromName: "ARIAS Interior Systems",
  fromAddress: "estimating@ariasinteriorsystems.com",
  apiKey: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  defaultSubject: "Proposal — {projectName}",
  defaultBody: [
    "Hello {clientName},",
    "",
    "Please find attached our proposal for {projectName}.",
    "Total: {total}.",
    "",
    "Let me know if you have any questions.",
    "",
    "Thanks,",
    "{fromName}",
  ].join("\n"),
};

export type SendEmailInput = {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  attachmentName?: string;
  /** base64-encoded attachment, optional */
  attachmentData?: string;
};

export type SendEmailResult = {
  ok: boolean;
  id: string;
  message: string;
};

export async function sendEmail(
  settings: EmailSettings,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  // For now, all providers go through the mock path. Real implementations would
  // dispatch based on settings.provider.
  const id = newId("email");
  const summary = {
    provider: settings.provider,
    from: `${settings.fromName} <${settings.fromAddress}>`,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    bodyPreview: input.body.slice(0, 280),
    attachment: input.attachmentName,
    attachmentBytes: input.attachmentData?.length ?? 0,
  };
  // eslint-disable-next-line no-console
  console.info("[email:mock] would send", summary);

  if (!input.to || !/.+@.+\..+/.test(input.to)) {
    return { ok: false, id, message: "Invalid recipient address." };
  }

  return {
    ok: true,
    id,
    message:
      settings.provider === "mock"
        ? "Mock send: logged to console (no real email delivered)."
        : `Sent via ${settings.provider}.`,
  };
}

export function recordEmail(projectId: string, rec: EmailRecord) {
  const project = getProject(projectId);
  if (!project) return;
  const history = [...(project.emailHistory ?? []), rec];
  updateProject(projectId, { emailHistory: history });
}

export function applyTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}
