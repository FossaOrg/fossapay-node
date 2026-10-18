import type { FossaPayClient } from "../client";
import type { ListOptions, Page } from "../types";

export interface Transaction {
  id: string;
  reference: string;
  status: string;
  type?: string;
  sourceAmount?: string | null;
  sourceCurrency?: string | null;
  destinationAmount?: string | null;
  destinationCurrency?: string | null;
  feeAmount?: string | null;
  feeCurrency?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface ListTransactionsOptions extends ListOptions {
  order?: "ASC" | "DESC";
  type?: "fiat" | "crypto";
  currency?: string;
  network?: string;
  minAmount?: string;
  maxAmount?: string;
  status?: string;
  paymentLinkId?: string;
  reference?: string;
  startDate?: string;
  endDate?: string;
}

export class TransactionsResource {
  constructor(private readonly client: FossaPayClient) {}

  list(options: ListTransactionsOptions = {}) {
    return this.client.request<Page<Transaction>>("/transactions", {
      query: { ...options },
    });
  }

  retrieve(id: string) {
    return this.client.request<Transaction>(`/transactions/${encodeURIComponent(id)}`);
  }
}
