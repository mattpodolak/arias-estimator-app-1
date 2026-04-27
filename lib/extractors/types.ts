import type { ExtractionResult } from "@/lib/types";

export type ExtractInput = {
  fileName?: string;
  mimeType: string;
  /** Base64-encoded file contents (no data: prefix). */
  data: string;
};

export type ExtractorErrorCode =
  | "config_missing"
  | "upstream_error"
  | "parse_error"
  | "timeout"
  | "unknown";

export class ExtractorError extends Error {
  code: ExtractorErrorCode;
  status: number;
  retryable: boolean;

  constructor(opts: {
    code: ExtractorErrorCode;
    message: string;
    status?: number;
    retryable?: boolean;
  }) {
    super(opts.message);
    this.code = opts.code;
    this.status = opts.status ?? 500;
    this.retryable = opts.retryable ?? false;
  }
}

export interface PlanExtractor {
  readonly name: string;
  extract(input: ExtractInput): Promise<ExtractionResult>;
}
