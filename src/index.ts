import { BanksResource } from "./resources/banks";
import { FossaPayClient } from "./client";
import { PayoutsResource } from "./resources/payouts";
import { TransactionsResource } from "./resources/transactions";
import { CollectionsResource, WalletsResource } from "./resources/wallets";
import { CustomersResource } from "./resources/customers";
import type { FossaPayOptions } from "./types";
import { WebhooksResource } from "./resources/webhooks";

export class FossaPay {
  readonly payouts: PayoutsResource;
  readonly banks: BanksResource;
  readonly transactions: TransactionsResource;
  readonly wallets: WalletsResource;
  readonly collections: CollectionsResource;
  readonly customers: CustomersResource;
  readonly webhooks: WebhooksResource;

  constructor(options: FossaPayOptions) {
    const client = new FossaPayClient(options);
    this.payouts = new PayoutsResource(client);
    this.banks = new BanksResource(client);
    this.transactions = new TransactionsResource(client);
    this.wallets = new WalletsResource(client);
    this.collections = new CollectionsResource(this.wallets.fiat);
    this.customers = new CustomersResource(client);
    this.webhooks = new WebhooksResource();
  }
}

export { FossaPayApiError, FossaPayConnectionError, FossaPayError } from "./errors";
export type * from "./types";
export type * from "./resources/banks";
export type * from "./resources/payouts";
export type * from "./resources/transactions";
export type * from "./resources/wallets";
export type * from "./resources/customers";
export * from "./resources/webhooks";
