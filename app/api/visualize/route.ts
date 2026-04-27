import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const SUPPORTED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const PROMPT = `Generate a single, photorealistic 3D rendering / isometric visualization of
the building or floor plan shown in the attached drawing. Use realistic materials,
neutral lighting, modern interior or exterior finishes consistent with construction
plans. Show walls, windows, and doors at correct relative scale. Output only one
image.`;

const MODEL = "gemini-2.5-flash-image-preview";

export async function POST(req: NextRequest) {
  let body: { mimeType?: string; data?: string; fileName?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { mimeType, data } = body;
  if (!data || !mimeType) {
    return NextResponse.json(
      { ok: false, error: "A plan file is required." },
      { status: 400 },
    );
  }
  if (!SUPPORTED_MIME.has(mimeType)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported file type for 3D visualization: ${mimeType}. Use PNG, JPG, WebP, or PDF.`,
      },
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: body.prompt && body.prompt.trim() ? body.prompt : PROMPT },
          { inline_data: { mime_type: mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message || text;
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          detail ||
          `3D visualization service returned ${res.status}.`,
      },
      { status: 502 },
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid response from visualization service." },
      { status: 502 },
    );
  }

  const found = findImagePart(json);
  if (!found) {
    const note = findTextPart(json);
    return NextResponse.json(
      {
        ok: false,
        error:
          note ||
          "The model did not return an image. Try a clearer plan image (PNG/JPG).",
      },
      { status: 502 },
    );
  }

  const dataUrl = `data:${found.mimeType};base64,${found.data}`;
  return NextResponse.json({
    ok: true,
    image: dataUrl,
    mimeType: found.mimeType,
    note: findTextPart(json) || null,
  });
}

type GenericObj = Record<string, unknown>;

function findImagePart(
  json: unknown,
): { mimeType: string; data: string } | null {
  const candidates = (json as GenericObj | null)?.candidates;
  if (!Array.isArray(candidates)) return null;
  for (const c of candidates) {
    const parts = (c as GenericObj | undefined)?.content as GenericObj | undefined;
    const partsArr = parts?.parts;
    if (!Array.isArray(partsArr)) continue;
    for (const p of partsArr) {
      const part = p as GenericObj;
      const inline =
        (part.inline_data as GenericObj | undefined) ||
        (part.inlineData as GenericObj | undefined);
      if (inline) {
        const mimeType =
          (inline.mime_type as string | undefined) ||
          (inline.mimeType as string | undefined);
        const data = inline.data as string | undefined;
        if (mimeType && data && mimeType.startsWith("image/")) {
          return { mimeType, data };
        }
      }
    }
  }
  return null;
}

function findTextPart(json: unknown): string | null {
  const candidates = (json as GenericObj | null)?.candidates;
  if (!Array.isArray(candidates)) return null;
  for (const c of candidates) {
    const parts = (c as GenericObj | undefined)?.content as GenericObj | undefined;
    const partsArr = parts?.parts;
    if (!Array.isArray(partsArr)) continue;
    for (const p of partsArr) {
      const part = p as GenericObj;
      const text = part.text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return null;
}
