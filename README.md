# FossaPay Node SDK

Official server-side Node.js SDK for FossaPay payouts, bank account resolution,
transactions, wallets, and collections.

## Install

```bash
npm install @fossapay/node
```

## Initialize

```ts
import { FossaPay } from "@fossapay/node";

const fossapay = new FossaPay({
  apiKey: process.env.FOSSAPAY_API_KEY!,
});
```

Keep API keys on your server. Do not import this package into browser code.

## Payouts

```ts
const payout = await fossapay.payouts.create(
  {
    amount: 5000,
    currency: "NGN",
    reference: "ORDER-10025",
    destinationBankCode: "000001",
    destinationBankName: "Example Bank",
    destinationAccountName: "Ada Lovelace",
    destinationAccountNumber: "0123456789",
    remarks: "Order settlement",
    metadata: { orderId: "10025" },
  },
  { idempotencyKey: "payout-order-10025" },
);

await fossapay.payouts.retrieve(payout.payoutId);
await fossapay.payouts.retrieveByReference("ORDER-10025");
```

Payouts require an active live full-access API key. Test API keys cannot initiate payouts. Reuse the same idempotency key when
retrying the same payout request.

## Banks

```ts
const banks = await fossapay.banks.list();

const account = await fossapay.banks.resolveAccount({
  bankCode: banks[0].code,
  accountNumber: "0123456789",
});
```

## Transactions

```ts
const page = await fossapay.transactions.list({
  page: 1,
  limit: 20,
  type: "fiat",
  status: "success",
});

const transaction = await fossapay.transactions.retrieve("TRANSACTION_ID");
```

## Fiat wallets

```ts
const master = await fossapay.wallets.fiat.getMaster();

const customer = await fossapay.customers.create({
  firstName: "Ada",
  lastName: "Lovelace",
  emailAddress: "ada@example.com",
  mobileNumber: "08012345678",
  dateOfBirth: "1990-08-15",
  address: "1 Example Street",
  city: "Lagos",
  country: "Nigeria",
}, { idempotencyKey: "customer-ada" });

const wallet = await fossapay.wallets.fiat.create({
  customerId: customer.id,
  walletName: "Ada wallet",
  walletReference: "CUSTOMER-ADA",
}, { idempotencyKey: "fiat-wallet-ada" });

await fossapay.wallets.fiat.list();
await fossapay.wallets.fiat.retrieve("WALLET_ID");
await fossapay.wallets.fiat.retrieveByAccountNumber("0123456789");
await fossapay.wallets.fiat.listTransactions("WALLET_ID", { page: 1 });
```

### Internal wallet transfer

```ts
await fossapay.wallets.fiat.transfer(
  {
    fromAccount: "0123456789",
    toAccount: "0987654321",
    amount: 5000,
    reference: "TRANSFER-10025",
    narration: "Customer wallet transfer",
  },
  { idempotencyKey: "transfer-10025" },
);
```

## Stablecoin wallets

```ts
const wallets = await fossapay.wallets.crypto.getMaster();
const wallet = await fossapay.wallets.crypto.create({
  customerId: "CUSTOMER_ID",
  network: "solana",
}, { idempotencyKey: "solana-wallet-CUSTOMER_ID" });
await fossapay.wallets.crypto.list();
await fossapay.wallets.crypto.getCustomerBalance("CUSTOMER_ID", "solana");
```

Supported stablecoins and balances are determined by the assets enabled for the
wallet and network.

## Collections

Collection accounts use customer fiat wallets and their dedicated NGN virtual
accounts:

```ts
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

const account = await fossapay.collections.createAccount({
  customerId: customer.id,
  walletName: "Ada collection account",
  walletReference: "CUSTOMER-ADA",
});

await fossapay.collections.retrieveAccount(account.id!);
await fossapay.collections.listTransactions(account.id!, { page: 1 });
```

Customers can also be retrieved and listed:

```ts
await fossapay.customers.retrieve(customer.id);
await fossapay.customers.list({ page: 1, limit: 20, search: "Ada" });
await fossapay.customers.listWallets(customer.id);
```

## Webhooks

Verify the signature against the exact raw request body. Use the v2 signature header for the complete event envelope.

```ts
import express from "express";

app.post("/webhooks/fossapay", express.raw({ type: "application/json" }), (req, res) => {
  const event = fossapay.webhooks.constructEvent(
    req.body,
    req.header("x-fossapay-signature-v2") ?? "",
    process.env.FOSSAPAY_WEBHOOK_SECRET!,
    { toleranceSeconds: 300 },
  );

  if (event.eventType === "payout.completed") {
    console.log(event.data.payoutId, event.data.reference);
  }

  res.sendStatus(200);
});
```

Store `event.eventId` and ignore an event you have already processed. Webhooks can be retried and may arrive more than once.

## Errors

```ts
import { FossaPayApiError } from "@fossapay/node";

try {
  await fossapay.payouts.retrieve("UNKNOWN_ID");
} catch (error) {
  if (error instanceof FossaPayApiError) {
    console.log(error.status, error.code, error.message);
  }
}
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```
