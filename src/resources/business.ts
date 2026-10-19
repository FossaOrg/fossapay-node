import type { FossaPayClient } from "../client";

export interface Business {
  id: string;
  businessName: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  country: string;
  isVerified: boolean;
  kycLevel: "unverified" | "tier_1" | "tier_2" | "tier_3";
  environment: "test" | "live";
}

export class BusinessResource {
  constructor(private readonly client: FossaPayClient) {}

  retrieve() {
    return this.client.request<Business>("/business");
  }
}
