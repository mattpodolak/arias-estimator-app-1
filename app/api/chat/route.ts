import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const INLINE_LIMIT = 4 * 1024 * 1024;
const POLL_MS = 2000;

type ChatTurn = { role: "user" | "model"; text: string };

type Attachment = {
  fileName?: string;
  mimeType: string;
  data: string;
};

const SYSTEM_PROMPT = `You are an expert construction assistant for a contractor named ARIAS.
You help with takeoffs, estimating, plan reading, materials, code references, and
day-to-day construction questions across all major trades — drywall, framing,
electrical, plumbing, HVAC, painting, flooring, roofing, concrete, carpentry,
insulation, windows/doors, tile, cabinetry, and more.

When the user attaches a plan or photo, ground your answer in what's visible.
When they ask a general question, draw on standard industry knowledge and be
concrete: cite typical units, rates, and code references when relevant.
Keep replies tight and quantitative. Use plain text (no markdown headers).
If you genuinely don't know, say so — don't invent specifics.`;

export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    history?: ChatTurn[];
    attachment?: Attachment | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const message = (body.message ?? "").trim();
  const history = body.history ?? [];
  const attachment = body.attachment ?? null;

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Message is required." },
      { status: 400 },
    );
  }

  if (attachment) {
    if (!attachment.data || !attachment.mimeType) {
      return NextResponse.json(
        { ok: false, error: "Attachment is missing data or mime type." },
        { status: 400 },
      );
    }
    if (!SUPPORTED_MIME.has(attachment.mimeType)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported file type: ${attachment.mimeType}.` },
        { status: 400 },
      );
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.4 },
    systemInstruction: SYSTEM_PROMPT,
  });

  let fileManager: GoogleAIFileManager | null = null;
  let uploadedName: string | undefined;

  try {
    const userParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
      | { fileData: { mimeType: string; fileUri: string } }
    > = [];

    if (attachment) {
      const buffer = Buffer.from(attachment.data, "base64");
      const useFileApi = buffer.byteLength > INLINE_LIMIT;
      if (useFileApi) {
        fileManager = new GoogleAIFileManager(apiKey);
        const upload = await fileManager.uploadFile(buffer, {
          mimeType: attachment.mimeType,
          displayName: attachment.fileName ?? "attachment",
        });
        uploadedName = upload.file.name;
        let file = await fileManager.getFile(uploadedName);
        while (file.state === FileState.PROCESSING) {
          await new Promise((r) => setTimeout(r, POLL_MS));
          file = await fileManager.getFile(uploadedName);
        }
        if (file.state !== FileState.ACTIVE) {
          throw new Error(
            `Gemini could not process the attachment (state ${file.state}).`,
          );
        }
        userParts.push({
          fileData: { mimeType: file.mimeType, fileUri: file.uri },
        });
      } else {
        userParts.push({
          inlineData: { mimeType: attachment.mimeType, data: attachment.data },
        });
      }
    }

    userParts.push({ text: message });

    const historyParts = history
      .filter((t) => t.text && t.text.trim())
      .map((t) => ({
        role: t.role === "model" ? "model" : "user",
        parts: [{ text: t.text }],
      }));

    const contents = [
      ...historyParts,
      { role: "user" as const, parts: userParts },
    ];

    const result = await model.generateContent({ contents });
    const answer = result.response.text();
    return NextResponse.json({ ok: true, answer });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Unknown chat error";
    return NextResponse.json(
      { ok: false, error: messageText },
      { status: 502 },
    );
  } finally {
    if (uploadedName && fileManager) {
      try {
        await fileManager.deleteFile(uploadedName);
      } catch {
        /* best effort */
      }
    }
  }
}
