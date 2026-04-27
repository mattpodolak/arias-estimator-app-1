import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXTRACTION_PROMPT } from "@/lib/gemini-prompt";
import type { ExtractApiResponse, ExtractionResult } from "@/lib/types";

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

function emptyResult(notes: string): ExtractionResult {
  return {
    measurements: {
      drywall_sf: 0,
      metal_framing_sf: 0,
      taping_sf: 0,
      corner_bead_lf: 0,
      door_count: 0,
      window_count: 0,
      corner_count: 0,
      other_items: [],
      notes,
    },
    summary: "",
    confidence: "low",
  };
}

function parseModelJson(text: string): ExtractionResult | null {
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
    const parsed = JSON.parse(json);
    const m = parsed.measurements ?? {};
    return {
      measurements: {
        drywall_sf: Number(m.drywall_sf) || 0,
        metal_framing_sf: Number(m.metal_framing_sf) || 0,
        taping_sf: Number(m.taping_sf) || 0,
        corner_bead_lf: Number(m.corner_bead_lf) || 0,
        door_count: Number(m.door_count) || 0,
        window_count: Number(m.window_count) || 0,
        corner_count: Number(m.corner_count) || 0,
        other_items: Array.isArray(m.other_items)
          ? m.other_items
              .map((it: { description?: unknown; quantity?: unknown; unit?: unknown }) => ({
                description: String(it?.description ?? ""),
                quantity: Number(it?.quantity) || 0,
                unit: (["SF", "LF", "EA"].includes(String(it?.unit))
                  ? it?.unit
                  : "EA") as "SF" | "LF" | "EA",
              }))
              .filter((it: { description: string }) => it.description)
          : [],
        notes: typeof m.notes === "string" ? m.notes : "",
      },
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      confidence:
        parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low",
      rawText: text,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ExtractApiResponse>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let payload: { fileName?: string; mimeType?: string; data?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { fileName, mimeType, data } = payload;
  if (!data || !mimeType) {
    return NextResponse.json(
      { ok: false, error: "Missing 'data' or 'mimeType' in request body." },
      { status: 400 },
    );
  }
  if (!SUPPORTED_MIME.has(mimeType)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported file type: ${mimeType}. Upload a PDF or image (png/jpg/webp).`,
      },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      { text: `\nFile: ${fileName ?? "(unnamed)"}\n` },
      {
        inlineData: {
          mimeType,
          data,
        },
      },
    ]);

    const text = result.response.text();
    const parsed = parseModelJson(text);
    if (!parsed) {
      return NextResponse.json({
        ok: true,
        result: {
          ...emptyResult(
            "Model response could not be parsed as JSON. Please review and edit quantities manually.",
          ),
          rawText: text,
        },
      });
    }
    return NextResponse.json({ ok: true, result: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown extraction error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
// Force rebuild 1777257196
