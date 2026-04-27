import type { ExtractionResult } from "@/lib/types";
import { emptyResult, normalizeExtraction, parseModelJson } from "./parse";
import { ExtractorError, type ExtractInput, type PlanExtractor } from "./types";

const DEFAULT_GUILD_URL = "https://agents.joinguild.ai/api/extract";
const DEFAULT_TIMEOUT_MS = 55_000;

type GuildResponse = {
  ok?: boolean;
  error?: string;
  result?: unknown;
  measurements?: unknown;
  summary?: unknown;
  confidence?: unknown;
  rawText?: string;
};

export class GuildExtractor implements PlanExtractor {
  readonly name = "guild";
  private apiKey: string;
  private endpoint: string;
  private timeoutMs: number;

  constructor(opts: { apiKey: string | undefined; endpoint?: string; timeoutMs?: number }) {
    if (!opts.apiKey) {
      throw new ExtractorError({
        code: "config_missing",
        message: "GUILD_API_KEY is not configured on the server.",
        status: 500,
      });
    }
    this.apiKey = opts.apiKey;
    this.endpoint = opts.endpoint || DEFAULT_GUILD_URL;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async extract(input: ExtractInput): Promise<ExtractionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Guild-Client": "arias-estimator",
        },
        body: JSON.stringify({
          fileName: input.fileName,
          mimeType: input.mimeType,
          data: input.data,
          extractor: "construction-takeoff",
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      throw new ExtractorError({
        code: aborted ? "timeout" : "upstream_error",
        message: aborted
          ? "Guild AI extraction timed out. Please try again."
          : err instanceof Error
            ? err.message
            : "Network error contacting Guild AI.",
        status: aborted ? 504 : 502,
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const bodyText = await safeReadText(res);
      throw new ExtractorError({
        code: "upstream_error",
        message: `Guild AI returned ${res.status}: ${bodyText.slice(0, 300) || res.statusText}`,
        status: res.status >= 500 ? 502 : 400,
        retryable: res.status >= 500 || res.status === 429,
      });
    }

    let payload: GuildResponse;
    try {
      payload = (await res.json()) as GuildResponse;
    } catch (err) {
      throw new ExtractorError({
        code: "parse_error",
        message: "Could not parse Guild AI response.",
        status: 502,
        retryable: true,
      });
    }

    if (payload.ok === false && payload.error) {
      throw new ExtractorError({
        code: "upstream_error",
        message: payload.error,
        status: 502,
      });
    }

    const candidate =
      payload.result && typeof payload.result === "object" ? payload.result : payload;
    const normalized = normalizeExtraction(candidate, payload.rawText);
    if (normalized) return normalized;

    if (payload.rawText) {
      const fromRaw = parseModelJson(payload.rawText);
      if (fromRaw) return fromRaw;
    }

    return {
      ...emptyResult(
        "Guild AI response could not be parsed. Please review and edit quantities manually.",
      ),
      rawText: payload.rawText,
    };
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
