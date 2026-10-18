import type { FossaPayClient } from "../client";
import { resolveIdempotencyKey } from "../idempotency";
import type { ListOptions, RequestOptions } from "../types";
import type { CustomerWallets } from "./wallets";

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  emailAddress: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
  type?: "individual";
}

export interface Customer {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  emailAddress: string;
  mobileNumber: string;
  dob: string;
  address: string;
  city?: string;
  customerType: "individual";
  createdAt?: string;
}

export interface ListCustomersOptions extends ListOptions {
  search?: string;
  sortBy?: "createdAt" | "firstName" | "lastName" | "emailAddress";
  sortOrder?: "ASC" | "DESC" | "asc" | "desc";
}

export interface CustomerPage {
  result: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class CustomersResource {
  constructor(private readonly client: FossaPayClient) {}

  create(request: CreateCustomerRequest, options: RequestOptions = {}) {
    return this.client.request<Customer>("/customers", {
      method: "POST",
      body: { ...request, type: request.type ?? "individual" },
      idempotencyKey: resolveIdempotencyKey(options),
      timeoutMs: options.timeoutMs,
    });
  }

  retrieve(id: string) {
    return this.client.request<Customer>(`/customers/${encodeURIComponent(id)}`);
  }

  listWallets(id: string) {
    return this.client.request<CustomerWallets>(`/customers/${encodeURIComponent(id)}/wallets`);
  }

  list(options: ListCustomersOptions = {}) {
    return this.client.request<CustomerPage>("/customers", {
      query: { ...options },
    });
  }
}
