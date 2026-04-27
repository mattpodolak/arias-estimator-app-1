import { GeminiExtractor } from "./gemini";
import { GuildExtractor } from "./guild";
import { ExtractorError, type PlanExtractor } from "./types";

export { ExtractorError } from "./types";
export type { ExtractInput, ExtractorErrorCode, PlanExtractor } from "./types";

export type ExtractorBackend = "guild" | "gemini";

function resolveBackend(): ExtractorBackend {
  const raw = (process.env.EXTRACTOR_BACKEND || "").toLowerCase().trim();
  if (raw === "gemini") return "gemini";
  if (raw === "guild") return "guild";
  // Only use guild if GUILD_API_KEY is actually set
  if (process.env.GUILD_API_KEY) return "guild";
  // Default to gemini (most users have this)
  return "gemini";
}

export function getExtractor(): PlanExtractor {
  const backend = resolveBackend();
  if (backend === "guild") {
    return new GuildExtractor({
      apiKey: process.env.GUILD_API_KEY,
      endpoint: process.env.GUILD_API_URL,
    });
  }
  return new GeminiExtractor(process.env.GEMINI_API_KEY);
}

export async function extractWithRetry(
  extractor: PlanExtractor,
  input: Parameters<PlanExtractor["extract"]>[0],
  attempts = 2,
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await extractor.extract(input);
    } catch (err) {
      lastErr = err;
      const isRetryable = err instanceof ExtractorError && err.retryable;
      if (!isRetryable || i === attempts - 1) throw err;
      const delay = 500 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
