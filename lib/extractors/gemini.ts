import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXTRACTION_PROMPT } from "@/lib/gemini-prompt";
import type { ExtractionResult } from "@/lib/types";
import { emptyResult, parseModelJson } from "./parse";
import { ExtractorError, type ExtractInput, type PlanExtractor } from "./types";

export class GeminiExtractor implements PlanExtractor {
  readonly name = "gemini";
  private apiKey: string;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new ExtractorError({
        code: "config_missing",
        message: "GEMINI_API_KEY is not configured on the server.",
        status: 500,
      });
    }
    this.apiKey = apiKey;
  }

  async extract(input: ExtractInput): Promise<ExtractionResult> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let result;
    try {
      result = await model.generateContent([
        { text: EXTRACTION_PROMPT },
        { text: `\nFile: ${input.fileName ?? "(unnamed)"}\n` },
        { inlineData: { mimeType: input.mimeType, data: input.data } },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown extraction error";
      throw new ExtractorError({
        code: "upstream_error",
        message,
        status: 502,
        retryable: true,
      });
    }

    const text = result.response.text();
    const parsed = parseModelJson(text);
    if (!parsed) {
      return {
        ...emptyResult(
          "Model response could not be parsed as JSON. Please review and edit quantities manually.",
        ),
        rawText: text,
      };
    }
    return parsed;
  }
}
