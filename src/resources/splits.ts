import type { FossaPayClient } from "../client";

export type SplitType = "percentage" | "flat";
export type SplitCollectionType = "checkout" | "direct_deposit";
export type SplitFeePayer = "master_wallet" | "evenly_distributed" | "specific_recipient";
export type SplitRecipientType = "subaccount" | "external_bank";

export interface CreateSplitRequest {
  name: string;
  type: SplitType;
  currency: "NGN";
  collectionTypes: SplitCollectionType[];
  minimumPaymentAmount?: string;
}

export interface UpdateSplitRequest {
  name?: string;
  collectionTypes?: SplitCollectionType[];
  minimumPaymentAmount?: string;
  feePayer?: SplitFeePayer;
  feePayerRecipientId?: string | null;
}

export interface AddSplitRecipientRequest {
  type: SplitRecipientType;
  allocation: string;
  virtualAccountId?: string;
  accountNumber?: string;
  bankCode?: string;
}

export interface SplitRecipient {
  id: string;
  type: SplitRecipientType;
  virtualAccountId: string | null;
  accountNumber: string;
  accountName: string;
  bankCode: string | null;
  bankName: string | null;
  allocation: string;
}

export interface TransactionSplit {
  id: string;
  splitCode: string;
  name: string;
  currency: "NGN";
  type: SplitType;
  status: "draft" | "active" | "paused";
  collectionTypes: SplitCollectionType[];
  minimumPaymentAmount: string | null;
  feePayer: SplitFeePayer;
  feePayerRecipientId: string | null;
  version: number;
  recipientCount?: number;
  recipients?: SplitRecipient[];
  createdAt: string;
  updatedAt: string;
}

export interface SplitPreview {
  eligible: boolean;
  reason: string | null;
  grossAmount: string;
  platformFee: string;
  distributableAmount: string;
  allocations: Array<{ recipientId: string; amount: string; platformFeeShare: string }>;
  masterRemainder: string;
  feePayer: SplitFeePayer;
}

export interface UpdateSplitSourcesRequest {
  productIds?: string[];
  storeIds?: string[];
  paymentLinkIds?: string[];
}

export interface SplitSourceItem {
  id: string;
  name: string;
  status: string;
  splitId: string | null;
  code?: string;
}

export interface SplitSources {
  products: SplitSourceItem[];
  stores: SplitSourceItem[];
  paymentLinks: SplitSourceItem[];
}

export class SplitsResource {
  constructor(private readonly client: FossaPayClient) {}

  create(request: CreateSplitRequest) {
    return this.client.request<TransactionSplit>("/splits", { method: "POST", body: request });
  }

  list() {
    return this.client.request<TransactionSplit[]>("/splits");
  }

  retrieve(splitCode: string) {
    return this.client.request<TransactionSplit>(`/splits/${encodeURIComponent(splitCode)}`);
  }

  update(splitCode: string, request: UpdateSplitRequest) {
    return this.client.request<TransactionSplit>(`/splits/${encodeURIComponent(splitCode)}`, { method: "PATCH", body: request });
  }

  addRecipient(splitCode: string, request: AddSplitRecipientRequest) {
    return this.client.request<SplitRecipient>(`/splits/${encodeURIComponent(splitCode)}/recipients`, { method: "POST", body: request });
  }

  updateRecipient(splitCode: string, recipientId: string, allocation: string) {
    return this.client.request<SplitRecipient>(`/splits/${encodeURIComponent(splitCode)}/recipients/${encodeURIComponent(recipientId)}`, { method: "PATCH", body: { allocation } });
  }

  removeRecipient(splitCode: string, recipientId: string) {
    return this.client.request<{ deleted: boolean }>(`/splits/${encodeURIComponent(splitCode)}/recipients/${encodeURIComponent(recipientId)}`, { method: "DELETE" });
  }

  preview(splitCode: string, amount: string, collectionType: SplitCollectionType) {
    return this.client.request<SplitPreview>(`/splits/${encodeURIComponent(splitCode)}/preview`, { query: { amount, collectionType } });
  }

  activate(splitCode: string) {
    return this.client.request<TransactionSplit>(`/splits/${encodeURIComponent(splitCode)}/activate`, { method: "POST" });
  }

  pause(splitCode: string) {
    return this.client.request<TransactionSplit>(`/splits/${encodeURIComponent(splitCode)}/pause`, { method: "POST" });
  }

  listSources(splitCode: string) {
    return this.client.request<SplitSources>(`/splits/${encodeURIComponent(splitCode)}/sources`);
  }

  updateSources(splitCode: string, request: UpdateSplitSourcesRequest) {
    return this.client.request<SplitSources>(`/splits/${encodeURIComponent(splitCode)}/sources`, { method: "PUT", body: request });
  }

  listTransactions(splitCode: string) {
    return this.client.request<Record<string, unknown>[]>(`/splits/${encodeURIComponent(splitCode)}/transactions`);
  }
}
