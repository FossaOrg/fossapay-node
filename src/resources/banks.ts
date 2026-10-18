import type { FossaPayClient } from "../client";

export interface Bank {
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface ResolveBankAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface ResolvedBankAccount {
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  bankName?: string;
  [key: string]: unknown;
}

export class BanksResource {
  constructor(private readonly client: FossaPayClient) {}

  list() {
    return this.client.request<Bank[]>("/transfers/fiat/banks");
  }

  resolveAccount(request: ResolveBankAccountRequest) {
    if (!/^\d{10}$/.test(request.accountNumber)) {
      throw new Error("accountNumber must contain exactly 10 digits");
    }
    return this.client.request<ResolvedBankAccount>("/transfers/fiat/bank-name-enquiry", {
      method: "POST",
      body: request,
    });
  }
}
