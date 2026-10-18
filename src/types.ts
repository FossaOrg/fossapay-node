export interface RequestOptions {
  idempotencyKey?: string;
  timeoutMs?: number;
}

export interface ListOptions {
  page?: number;
  limit?: number;
}

export interface PageMeta {
  page?: number;
  limit?: number;
  take?: number;
  itemCount?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  [key: string]: unknown;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export type Money = string;

export interface FossaPayOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetch?: typeof globalThis.fetch;
}
