import { BanksResource } from "./resources/banks";
import { FossaPayClient } from "./client";
import { PayoutsResource } from "./resources/payouts";
import { TransactionsResource } from "./resources/transactions";
import { CollectionsResource, WalletsResource } from "./resources/wallets";
import { CustomersResource } from "./resources/customers";
import type { FossaPayOptions } from "./types";
import { WebhooksResource } from "./resources/webhooks";
import { BusinessResource } from "./resources/business";

export class FossaPay {
  readonly business: BusinessResource;
  readonly customers: CustomersResource;
  readonly wallets: WalletsResource;
  readonly collections: CollectionsResource;
  readonly transactions: TransactionsResource;
  readonly banks: BanksResource;
  readonly payouts: PayoutsResource;
  readonly webhooks: WebhooksResource;

  constructor(options: FossaPayOptions) {
    const client = new FossaPayClient(options);
    this.business = new BusinessResource(client);
    this.customers = new CustomersResource(client);
    this.wallets = new WalletsResource(client);
    this.collections = new CollectionsResource(this.wallets.fiat);
    this.transactions = new TransactionsResource(client);
    this.banks = new BanksResource(client);
    this.payouts = new PayoutsResource(client);
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
export type * from "./resources/business";
export * from "./resources/webhooks";
