import { NextRequest, NextResponse } from "next/server";
import type { SignatureRequest, SignatureStatus } from "@/lib/types";

export const runtime = "nodejs";

type SignatureRecord = SignatureRequest & {
  proposalNumber: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __ARIAS_SIGNATURES__: Map<string, SignatureRecord> | undefined;
}

const store: Map<string, SignatureRecord> =
  globalThis.__ARIAS_SIGNATURES__ ?? new Map<string, SignatureRecord>();
globalThis.__ARIAS_SIGNATURES__ = store;

function newId() {
  return (
    "sig_" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function POST(req: NextRequest) {
  let body: {
    contractorEmail?: string;
    clientEmail?: string;
    proposalNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const { contractorEmail, clientEmail, proposalNumber } = body;
  if (!clientEmail) {
    return NextResponse.json(
      { ok: false, error: "Client email is required to send a signing request." },
      { status: 400 },
    );
  }
  const id = newId();
  const origin = req.nextUrl.origin;
  const record: SignatureRecord = {
    id,
    contractorEmail: contractorEmail || "",
    clientEmail,
    signingUrl: `${origin}/sign/${id}`,
    status: "sent",
    createdAt: new Date().toISOString(),
    proposalNumber: proposalNumber || "",
  };
  store.set(id, record);
  return NextResponse.json({ ok: true, signature: record });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: true, signatures: Array.from(store.values()) },
      { status: 200 },
    );
  }
  const rec = store.get(id);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, signature: rec });
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string; status?: SignatureStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json(
      { ok: false, error: "Missing id or status." },
      { status: 400 },
    );
  }
  const rec = store.get(id);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  rec.status = status;
  if (status === "signed") rec.signedAt = new Date().toISOString();
  store.set(id, rec);
  return NextResponse.json({ ok: true, signature: rec });
}
