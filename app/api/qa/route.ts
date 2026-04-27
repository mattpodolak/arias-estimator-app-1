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

const SYSTEM_PROMPT = `You are an expert construction estimator helping a contractor understand
uploaded plans (PDFs or drawings). Answer the user's questions based ONLY on what
is visible in the attached file. Be concise and quantitative when possible (cite
ceiling heights, dimensions, counts, etc.). If something cannot be determined
from the plan, say so explicitly. Use plain text — no markdown headers.`;

export async function POST(req: NextRequest) {
  let body: {
    question?: string;
    history?: ChatTurn[];
    fileName?: string;
    mimeType?: string;
    data?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { question, mimeType, data, fileName } = body;
  const history = body.history ?? [];

  if (!question || !question.trim()) {
    return NextResponse.json(
      { ok: false, error: "Question is required." },
      { status: 400 },
    );
  }
  if (!data || !mimeType) {
    return NextResponse.json(
      { ok: false, error: "A plan file is required for Q&A." },
      { status: 400 },
    );
  }
  if (!SUPPORTED_MIME.has(mimeType)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported file type: ${mimeType}.` },
      { status: 400 },
    );
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
    generationConfig: { temperature: 0.3 },
    systemInstruction: SYSTEM_PROMPT,
  });

  const buffer = Buffer.from(data, "base64");
  const useFileApi = buffer.byteLength > INLINE_LIMIT;
  const fileManager = useFileApi ? new GoogleAIFileManager(apiKey) : null;
  let uploadedName: string | undefined;

  try {
    let filePart:
      | { inlineData: { mimeType: string; data: string } }
      | { fileData: { mimeType: string; fileUri: string } };

    if (useFileApi && fileManager) {
      const upload = await fileManager.uploadFile(buffer, {
        mimeType,
        displayName: fileName ?? "plan",
      });
      uploadedName = upload.file.name;
      let file = await fileManager.getFile(uploadedName);
      while (file.state === FileState.PROCESSING) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        file = await fileManager.getFile(uploadedName);
      }
      if (file.state !== FileState.ACTIVE) {
        throw new Error(`Gemini could not process the file (state ${file.state}).`);
      }
      filePart = { fileData: { mimeType: file.mimeType, fileUri: file.uri } };
    } else {
      filePart = { inlineData: { mimeType, data } };
    }

    const historyParts = history
      .filter((t) => t.text && t.text.trim())
      .map((t) => ({
        role: t.role === "model" ? "model" : "user",
        parts: [{ text: t.text }],
      }));

    const contents = [
      ...historyParts,
      {
        role: "user" as const,
        parts: [filePart, { text: question }],
      },
    ];

    const result = await model.generateContent({ contents });
    const answer = result.response.text();
    return NextResponse.json({ ok: true, answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Q&A error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
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
