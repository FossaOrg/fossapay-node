import { FossaPayApiError, FossaPayConnectionError } from "./errors";
import type { FossaPayOptions, RequestOptions } from "./types";

interface ApiEnvelope<T> {
  success?: boolean;
  status?: string | boolean;
  statusCode?: number;
  message?: string;
  code?: string;
  data?: T;
}

export interface ClientRequest extends RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

const SDK_VERSION = "0.1.0-beta.0";

export class FossaPayClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: FossaPayOptions) {
    if (!options?.apiKey?.trim()) throw new Error("apiKey is required");
    const fetcher = options.fetch ?? globalThis.fetch;
    if (!fetcher) throw new Error("A Fetch API implementation is required");
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl ?? "https://api-production.fossapay.com/api/v1").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetcher = fetcher;
  }

  async request<T>(path: string, options: ClientRequest = {}): Promise<T> {
    const method = options.method ?? "GET";
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const canRetry = method === "GET" || Boolean(options.idempotencyKey);
    const attempts = canRetry ? this.maxRetries + 1 : 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);
      try {
        const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
        const headers: Record<string, string> = {
          "x-api-key": this.apiKey,
          "user-agent": `fossapay-node/${SDK_VERSION}`,
        };
        if (!isForm && options.body !== undefined) headers["content-type"] = "application/json";
        if (options.idempotencyKey) {
          headers["x-idempotency-key"] = options.idempotencyKey;
          headers["idempotency-key"] = options.idempotencyKey;
        }
        const response = await this.fetcher(url, {
          method,
          headers,
          body: options.body === undefined
            ? undefined
            : isForm
              ? (options.body as FormData)
              : JSON.stringify(options.body),
          signal: controller.signal,
        });
        const requestId = response.headers.get("x-request-id") ?? undefined;
        const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, unknown>;
        if (!response.ok) {
          const error = new FossaPayApiError({
            message: body.message ?? `FossaPay API request failed with status ${response.status}`,
            status: response.status,
            code: body.code,
            requestId,
            details: body,
          });
          if (attempt + 1 < attempts && this.isRetryable(response.status)) {
            lastError = error;
            await this.wait(attempt);
            continue;
          }
          throw error;
        }
        return this.unwrap<T>(body);
      } catch (error) {
        if (error instanceof FossaPayApiError) throw error;
        lastError = error;
        if (attempt + 1 < attempts) {
          await this.wait(attempt);
          continue;
        }
        const message = error instanceof Error && error.name === "AbortError"
          ? "FossaPay API request timed out"
          : "Unable to connect to the FossaPay API";
        throw new FossaPayConnectionError(message, error);
      } finally {
        clearTimeout(timer);
      }
    }
    throw new FossaPayConnectionError("Unable to connect to the FossaPay API", lastError);
  }

  private unwrap<T>(body: ApiEnvelope<T> & Record<string, unknown>): T {
    const isEnvelope = "data" in body && ("message" in body || "success" in body || "statusCode" in body);
    return (isEnvelope ? body.data : body) as T;
  }

  private isRetryable(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }

  private async wait(attempt: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
  }
}
