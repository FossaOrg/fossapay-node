import { createHmac, timingSafeEqual } from "node:crypto";

export type WebhookEventType =
  | "deposit.completed"
  | "withdrawal.completed"
  | "withdrawal.failed"
  | "transfer.completed"
  | "transfer.failed"
  | "wallet.balance.updated"
  | "checkout.completed"
  | "checkout.failed"
  | "checkout.expired"
  | "checkout.reversed"
  | "payout.completed"
  | "payout.failed"
  | "payout.reversed";

export interface TransactionEventData {
  id?: string;
  transactionId?: string;
  reference?: string;
  status?: string;
  type?: string;
  amount?: string | number;
  currency?: string;
  fee?: string | number;
  [key: string]: unknown;
}

export interface WalletBalanceEventData {
  walletId?: string;
  accountNumber?: string;
  currency?: string;
  availableBalance?: string | number;
  ledgerBalance?: string | number;
  [key: string]: unknown;
}

export interface CheckoutEventData extends TransactionEventData {
  checkoutId?: string;
  paymentLink?: string;
  customer?: Record<string, unknown> | null;
}

export interface PayoutEventData {
  payoutId: string;
  transactionId: string | null;
  reference: string;
  status: string;
  route: string;
  amount: { amount: string | number; currency: string };
  fee: { amount: string | number; currency: string };
  totalDebited: { amount: string | number; currency: string };
  currency: string;
  recipient: Record<string, unknown>;
  providerReference: string | null;
  metadata: Record<string, unknown> | null;
  [key: string]: unknown;
}

type DataFor<T extends WebhookEventType> =
  T extends `payout.${string}` ? PayoutEventData
    : T extends `checkout.${string}` ? CheckoutEventData
      : T extends "wallet.balance.updated" ? WalletBalanceEventData
        : TransactionEventData;

export type WebhookEvent<T extends WebhookEventType = WebhookEventType> = T extends WebhookEventType
  ? { eventId: string; eventType: T; data: DataFor<T>; timestamp: string }
  : never;

export interface ConstructWebhookEventOptions {
  toleranceSeconds?: number;
  now?: Date;
}

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

export class WebhooksResource {
  verifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = createHmac("sha256", secret).update(payload).digest();
    let received: Buffer;
    try {
      received = Buffer.from(signature, "hex");
    } catch {
      return false;
    }
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
    options: ConstructWebhookEventOptions = {},
  ): WebhookEvent {
    if (!this.verifySignature(payload, signature, secret)) {
      throw new WebhookSignatureError("Invalid FossaPay webhook signature");
    }
    let event: unknown;
    try {
      event = JSON.parse(payload.toString());
    } catch {
      throw new WebhookSignatureError("Webhook payload is not valid JSON");
    }
    if (!isWebhookEvent(event)) {
      throw new WebhookSignatureError("Webhook payload has an invalid event envelope");
    }
    const tolerance = options.toleranceSeconds;
    if (tolerance !== undefined) {
      const receivedAt = Date.parse(event.timestamp);
      const now = (options.now ?? new Date()).getTime();
      if (!Number.isFinite(receivedAt) || Math.abs(now - receivedAt) > tolerance * 1000) {
        throw new WebhookSignatureError("Webhook timestamp is outside the allowed tolerance");
      }
    }
    return event;
  }
}

const eventTypes = new Set<WebhookEventType>([
  "deposit.completed", "withdrawal.completed", "withdrawal.failed",
  "transfer.completed", "transfer.failed", "wallet.balance.updated",
  "checkout.completed", "checkout.failed", "checkout.expired", "checkout.reversed",
  "payout.completed", "payout.failed", "payout.reversed",
]);

function isWebhookEvent(value: unknown): value is WebhookEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return typeof event.eventId === "string"
    && typeof event.eventType === "string"
    && eventTypes.has(event.eventType as WebhookEventType)
    && typeof event.timestamp === "string"
    && "data" in event;
}
