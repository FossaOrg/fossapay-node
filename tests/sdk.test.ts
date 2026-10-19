import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { FossaPay, FossaPayApiError, WebhookSignatureError } from "../src";

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("FossaPay Node SDK", () => {
  it("retrieves the business associated with the API key", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({
      success: true,
      data: { id: "merchant_1", businessName: "Example Ltd", environment: "live" },
    }));
    const fossapay = new FossaPay({ apiKey: "fk_live", fetch: fetcher });
    await expect(fossapay.business.retrieve()).resolves.toMatchObject({ id: "merchant_1" });
    expect((fetcher.mock.calls[0][0] as URL).pathname).toBe("/api/v1/business");
  });

  it("creates an idempotent payout", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      response({ message: "created", data: { payoutId: "pay_1", reference: "ORDER-1" } }, 202),
    );
    const fossapay = new FossaPay({ apiKey: "fk_live", fetch: fetcher });

    await fossapay.payouts.create(
      {
        amount: 5000,
        currency: "NGN",
        reference: "ORDER-1",
        destinationBankCode: "000001",
        destinationBankName: "Example Bank",
        destinationAccountName: "Ada Lovelace",
        destinationAccountNumber: "0123456789",
      },
      { idempotencyKey: "payout-order-1" },
    );

    const init = fetcher.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "x-api-key": "fk_live",
      "x-idempotency-key": "payout-order-1",
      "idempotency-key": "payout-order-1",
    });
  });

  it("lists transactions without unwrapping the page data", async () => {
    const page = { data: [{ id: "txn_1" }], meta: { page: 1, itemCount: 1 } };
    const fetcher = vi.fn().mockResolvedValue(response(page));
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });

    await expect(
      fossapay.transactions.list({ status: "success", page: 1 }),
    ).resolves.toEqual(page);
    const url = fetcher.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/v1/transactions");
    expect(url.searchParams.get("status")).toBe("success");
  });

  it("resolves a ten-digit bank account", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      response({ status: true, data: { accountNumber: "0123456789", accountName: "Ada" } }),
    );
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });

    await fossapay.banks.resolveAccount({
      bankCode: "000001",
      accountNumber: "0123456789",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(() =>
      fossapay.banks.resolveAccount({ bankCode: "000001", accountNumber: "123" }),
    ).toThrow("accountNumber must contain exactly 10 digits");
  });

  it("maps API failures to a typed error", async () => {
    const fossapay = new FossaPay({
      apiKey: "bad-key",
      maxRetries: 0,
      fetch: vi.fn().mockResolvedValue(
        response({ message: "API key is invalid", code: "invalid_api_key" }, 401),
      ),
    });

    await expect(fossapay.wallets.fiat.getMaster()).rejects.toMatchObject({
      name: "FossaPayApiError",
      status: 401,
      code: "invalid_api_key",
      message: "API key is invalid",
    } satisfies Partial<FossaPayApiError>);
  });

  it("exposes collection accounts through fiat wallet operations", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      response({ success: true, data: { id: "wallet_1", accountNumber: "0123456789" } }),
    );
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });
    await fossapay.collections.createAccount({
      customerId: "6fd92193-c02e-4b4a-b66c-bfba03569306",
      walletName: "Ada collection account",
      walletReference: "CUSTOMER-ADA",
    });
    const url = fetcher.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/v1/wallets/fiat/create");
  });

  it("creates a customer before creating their collection account", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          success: true,
          data: {
            id: "customer_1",
            firstName: "Ada",
            lastName: "Lovelace",
            customerType: "individual",
          },
        }),
      )
      .mockResolvedValueOnce(
        response({ success: true, data: { id: "wallet_1" } }),
      );
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });

    const customer = await fossapay.customers.create({
      firstName: "Ada",
      lastName: "Lovelace",
      emailAddress: "ada@example.com",
      mobileNumber: "08012345678",
      dateOfBirth: "1990-08-15",
      address: "1 Example Street",
      city: "Lagos",
      country: "Nigeria",
    });
    await fossapay.collections.createAccount({
      customerId: customer.id,
      walletName: "Ada collection account",
      walletReference: "CUSTOMER-ADA",
    });

    expect(JSON.parse(String((fetcher.mock.calls[0][1] as RequestInit).body))).toMatchObject({
      type: "individual",
    });
    expect((fetcher.mock.calls[0][0] as URL).pathname).toBe("/api/v1/customers");
    expect((fetcher.mock.calls[1][0] as URL).pathname).toBe("/api/v1/wallets/fiat/create");
  });

  it("adds idempotency keys to customer and wallet creation", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ success: true, data: { id: "created" } }));
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });
    await fossapay.customers.create({
      firstName: "Ada", lastName: "Lovelace", emailAddress: "ada@example.com",
      mobileNumber: "08012345678", dateOfBirth: "1990-08-15",
      address: "1 Example Street", city: "Lagos", country: "Nigeria",
    }, { idempotencyKey: "customer-ada" });
    await fossapay.wallets.crypto.create(
      { customerId: "created", network: "solana" },
      { idempotencyKey: "wallet-ada-solana" },
    );
    expect((fetcher.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      "x-idempotency-key": "customer-ada",
    });
    expect((fetcher.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      "x-idempotency-key": "wallet-ada-solana",
    });
  });

  it("lists wallets globally and for a customer", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ success: true, data: [] }));
    const fossapay = new FossaPay({ apiKey: "key", fetch: fetcher });
    await fossapay.wallets.fiat.list();
    await fossapay.wallets.crypto.list();
    await fossapay.customers.listWallets("customer_1");
    expect(fetcher.mock.calls.map((call) => (call[0] as URL).pathname)).toEqual([
      "/api/v1/wallets/fiat",
      "/api/v1/wallets/crypto",
      "/api/v1/customers/customer_1/wallets",
    ]);
  });

  it("verifies and constructs typed webhook events from the raw body", () => {
    const fossapay = new FossaPay({ apiKey: "key", fetch: vi.fn() });
    const raw = JSON.stringify({
      eventId: "evt_1", eventType: "payout.completed",
      data: { payoutId: "pay_1", transactionId: null, reference: "ORDER-1", status: "completed", route: "sterling", amount: { amount: 1000, currency: "NGN" }, fee: { amount: 20, currency: "NGN" }, totalDebited: { amount: 1020, currency: "NGN" }, currency: "NGN", recipient: {}, providerReference: null, metadata: null },
      timestamp: "2026-10-18T12:00:00.000Z",
    });
    const signature = createHmac("sha256", "whsec_test").update(raw).digest("hex");
    expect(fossapay.webhooks.constructEvent(raw, signature, "whsec_test").eventType)
      .toBe("payout.completed");
    expect(() => fossapay.webhooks.constructEvent(raw, "bad", "whsec_test"))
      .toThrow(WebhookSignatureError);
  });
});
