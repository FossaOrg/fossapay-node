import type { FossaPayClient } from "../client";
import { resolveIdempotencyKey } from "../idempotency";
import type { ListOptions, RequestOptions } from "../types";

export interface FiatWallet {
  id?: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  balance?: string | number;
  currency?: "NGN";
  [key: string]: unknown;
}

export interface CreateFiatWalletRequest {
  customerId: string;
  walletName: string;
  walletReference: string;
}

export interface WalletTransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  reference: string;
  narration: string;
}

export interface WalletTransaction {
  transactionId: string;
  transactionType: string;
  walletId: string;
  accountNumber: string;
  status: string;
  amount: number;
  fee: number;
  narration: string;
  reference: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface WalletTransactions {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletTransactionListOptions extends ListOptions {
  transactionType?: "deposit" | "withdrawal" | "transfer";
  startDate?: string;
  endDate?: string;
}

export interface CryptoWallet {
  id?: string;
  address?: string;
  network?: "solana" | "stellar";
  currency?: string;
  balances?: unknown;
  [key: string]: unknown;
}

export interface CustomerWallets {
  fiat: FiatWallet | null;
  crypto: CryptoWallet[];
}

export class FiatWalletsResource {
  constructor(private readonly client: FossaPayClient) {}

  getMaster() {
    return this.client.request<FiatWallet>("/wallets/fiat/master");
  }

  create(request: CreateFiatWalletRequest, options: RequestOptions = {}) {
    return this.client.request<FiatWallet>("/wallets/fiat/create", {
      method: "POST",
      body: request,
      idempotencyKey: resolveIdempotencyKey(options),
      timeoutMs: options.timeoutMs,
    });
  }

  list() {
    return this.client.request<FiatWallet[]>("/wallets/fiat");
  }

  retrieve(walletId: string) {
    return this.client.request<FiatWallet>(`/wallets/fiat/${encodeURIComponent(walletId)}`);
  }

  retrieveByAccountNumber(accountNumber: string) {
    return this.client.request<FiatWallet>(`/wallets/fiat/account/${encodeURIComponent(accountNumber)}`);
  }

  listTransactions(walletId: string, options: WalletTransactionListOptions = {}) {
    return this.client.request<WalletTransactions>(
      `/wallets/fiat/${encodeURIComponent(walletId)}/transactions`,
      { query: { ...options } },
    );
  }

  retrieveTransaction(transactionId: string) {
    return this.client.request<WalletTransaction>(
      `/wallets/fiat/transactions/${encodeURIComponent(transactionId)}`,
    );
  }

  transfer(request: WalletTransferRequest, options: RequestOptions = {}) {
    return this.client.request<{ success?: boolean; message?: string }>(
      "/wallets/fiat/transfers/wallet-to-wallet",
      {
        method: "POST",
        body: request,
        idempotencyKey: resolveIdempotencyKey(options),
        timeoutMs: options.timeoutMs,
      },
    );
  }
}

export class CryptoWalletsResource {
  constructor(private readonly client: FossaPayClient) {}

  getMaster() {
    return this.client.request<CryptoWallet[]>("/wallets/crypto/master");
  }

  createMaster(network: "solana" | "stellar", options: RequestOptions = {}) {
    return this.client.request<CryptoWallet>("/wallets/crypto/master/create", {
      method: "POST",
      body: { network },
      idempotencyKey: resolveIdempotencyKey(options),
      timeoutMs: options.timeoutMs,
    });
  }

  create(request: { customerId: string; network: "solana" | "stellar" }, options: RequestOptions = {}) {
    return this.client.request<CryptoWallet>("/wallets/crypto/create", {
      method: "POST",
      body: request,
      idempotencyKey: resolveIdempotencyKey(options),
      timeoutMs: options.timeoutMs,
    });
  }

  list() {
    return this.client.request<CryptoWallet[]>("/wallets/crypto");
  }

  retrieve(walletId: string) {
    return this.client.request<CryptoWallet>(`/wallets/crypto/${encodeURIComponent(walletId)}`);
  }

  retrieveByAddress(address: string) {
    return this.client.request<CryptoWallet>(`/wallets/crypto/address/${encodeURIComponent(address)}`);
  }

  getCustomerBalance(customerId: string, network?: "solana" | "stellar") {
    return this.client.request<CryptoWallet | CryptoWallet[]>(
      `/wallets/crypto/customer/${encodeURIComponent(customerId)}/balance`,
      { query: { network } },
    );
  }

  listTransactions(walletId: string, options: WalletTransactionListOptions = {}) {
    return this.client.request<WalletTransactions>(
      `/wallets/crypto/${encodeURIComponent(walletId)}/transactions`,
      { query: { ...options } },
    );
  }

  retrieveTransaction(transactionId: string) {
    return this.client.request<WalletTransaction>(
      `/wallets/crypto/transactions/${encodeURIComponent(transactionId)}`,
    );
  }
}

export class WalletsResource {
  readonly fiat: FiatWalletsResource;
  readonly crypto: CryptoWalletsResource;

  constructor(client: FossaPayClient) {
    this.fiat = new FiatWalletsResource(client);
    this.crypto = new CryptoWalletsResource(client);
  }
}

export class CollectionsResource {
  constructor(private readonly fiat: FiatWalletsResource) {}

  createAccount(request: CreateFiatWalletRequest, options: RequestOptions = {}) {
    return this.fiat.create(request, options);
  }

  retrieveAccount(walletId: string) {
    return this.fiat.retrieve(walletId);
  }

  retrieveAccountByNumber(accountNumber: string) {
    return this.fiat.retrieveByAccountNumber(accountNumber);
  }

  listTransactions(walletId: string, options: WalletTransactionListOptions = {}) {
    return this.fiat.listTransactions(walletId, options);
  }
}
