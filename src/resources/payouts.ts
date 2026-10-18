import type { FossaPayClient } from "../client";
import { resolveIdempotencyKey } from "../idempotency";
import type { Money, RequestOptions } from "../types";

export interface CreatePayoutRequest {
  amount: number;
  currency: "NGN";
  reference: string;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountName: string;
  destinationAccountNumber: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
}

export interface Payout {
  payoutId: string;
  transactionId: string | null;
  reference: string;
  status: string;
  route: string;
  amount: Money;
  fee: Money;
  totalDebited: Money;
  currency: "NGN";
  recipient: {
    bankCode: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  providerReference: string | null;
  metadata: Record<string, unknown> | null;
  completedAt: string | null;
  failedAt: string | null;
  reversedAt: string | null;
}

export class PayoutsResource {
  constructor(private readonly client: FossaPayClient) {}

  create(request: CreatePayoutRequest, options: RequestOptions = {}) {
    return this.client.request<Payout>("/payouts", {
      method: "POST",
      body: request,
      idempotencyKey: resolveIdempotencyKey(options),
      timeoutMs: options.timeoutMs,
    });
  }

  retrieve(id: string) {
    return this.client.request<Payout>(`/payouts/${encodeURIComponent(id)}`);
  }

  retrieveByReference(reference: string) {
    return this.client.request<Payout>(`/payouts/reference/${encodeURIComponent(reference)}`);
  }
}
