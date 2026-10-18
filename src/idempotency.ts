import type { RequestOptions } from "./types";

export function resolveIdempotencyKey(options: RequestOptions = {}): string {
  if (options.idempotencyKey?.trim()) return options.idempotencyKey.trim();
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `fossapay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
