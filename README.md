# FossaPay Node SDK

The official server side Node.js SDK for FossaPay customers, wallets, collections, transactions, bank account resolution, payouts, and webhooks.

## Requirements

- Node.js 18 or newer
- A FossaPay API key
- A verified FossaPay business
- A live API key for payouts

Keep API keys on your server. Do not expose this package or your API key in browser code.

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

CommonJS is also supported:

```js
const { FossaPay } = require("@fossapay/node");
```

Optional client settings:

```ts
const fossapay = new FossaPay({
  apiKey: process.env.FOSSAPAY_API_KEY!,
  baseUrl: "https://api-production.fossapay.com/api/v1",
  timeoutMs: 30_000,
  maxRetries: 2,
  fetch: globalThis.fetch,
});
```

## Recommended integration flow

### 1. Verify the connected business

```ts
const business = await fossapay.business.retrieve();

console.log(business.id);
console.log(business.businessName);
console.log(business.environment); // "test" or "live"
```

### 2. Create a customer

Customers own the dedicated fiat and stablecoin wallets created through the SDK.

```ts
const customer = await fossapay.customers.create(
  {
    firstName: "Ada",
    lastName: "Lovelace",
    emailAddress: "ada@example.com",
    mobileNumber: "08012345678",
    dateOfBirth: "1990-08-15",
    address: "1 Example Street",
    city: "Lagos",
    country: "Nigeria",
  },
  { idempotencyKey: "customer-ada" },
);
```

Retrieve and list customers:

```ts
await fossapay.customers.retrieve(customer.id);

const customers = await fossapay.customers.list({
  page: 1,
  limit: 20,
  search: "Ada",
  sortBy: "createdAt",
  sortOrder: "desc",
});
```

### 3. Create a customer wallet

#### NGN wallet and collection account

Creating a fiat wallet gives the customer a dedicated NGN virtual account for collections.

```ts
const fiatWallet = await fossapay.wallets.fiat.create(
  {
    customerId: customer.id,
    walletName: "Ada wallet",
    walletReference: "CUSTOMER-ADA",
  },
  { idempotencyKey: "fiat-wallet-ada" },
);
```

The collections alias provides the same account creation flow:

```ts
const account = await fossapay.collections.createAccount(
  {
    customerId: customer.id,
    walletName: "Ada collection account",
    walletReference: "COLLECTION-ADA",
  },
  { idempotencyKey: "collection-account-ada" },
);
```

#### Stablecoin wallet

```ts
const cryptoWallet = await fossapay.wallets.crypto.create(
  { customerId: customer.id, network: "solana" },
  { idempotencyKey: "solana-wallet-ada" },
);
```

Supported wallet networks are `solana` and `stellar`. Available assets depend on the assets enabled for the network.

### 4. Retrieve wallets and balances

```ts
const customerWallets = await fossapay.customers.listWallets(customer.id);

const fiatWallets = await fossapay.wallets.fiat.list();
const fiatWallet = await fossapay.wallets.fiat.retrieve("FIAT_WALLET_ID");
const walletByAccount = await fossapay.wallets.fiat.retrieveByAccountNumber("0123456789");
const masterFiatWallet = await fossapay.wallets.fiat.getMaster();

const cryptoWallets = await fossapay.wallets.crypto.list();
const cryptoById = await fossapay.wallets.crypto.retrieve("CRYPTO_WALLET_ID");
const cryptoByAddress = await fossapay.wallets.crypto.retrieveByAddress("WALLET_ADDRESS");
const balances = await fossapay.wallets.crypto.getCustomerBalance(customer.id, "solana");
const masterCryptoWallets = await fossapay.wallets.crypto.getMaster();
```

Create a master stablecoin wallet when the business does not already have one for the network:

```ts
await fossapay.wallets.crypto.createMaster(
  "solana",
  { idempotencyKey: "master-solana-wallet" },
);
```

### 5. Track collections and transactions

```ts
const transactions = await fossapay.transactions.list({
  page: 1,
  limit: 20,
  order: "DESC",
  type: "fiat",
  currency: "NGN",
  status: "success",
  reference: "ORDER-10025",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
});

await fossapay.transactions.retrieve("TRANSACTION_ID");
```

Other transaction filters include `network`, `minAmount`, `maxAmount`, and `paymentLinkId`.

Wallet and collection transactions:

```ts
await fossapay.wallets.fiat.listTransactions("FIAT_WALLET_ID", {
  page: 1,
  limit: 20,
  transactionType: "deposit",
});
await fossapay.wallets.fiat.retrieveTransaction("TRANSACTION_ID");

await fossapay.wallets.crypto.listTransactions("CRYPTO_WALLET_ID", { page: 1, limit: 20 });
await fossapay.wallets.crypto.retrieveTransaction("TRANSACTION_ID");

await fossapay.collections.retrieveAccount("FIAT_WALLET_ID");
await fossapay.collections.retrieveAccountByNumber("0123456789");
await fossapay.collections.listTransactions("FIAT_WALLET_ID", { page: 1, limit: 20 });
```

### 6. Transfer between customer wallets

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

### 7. Resolve a bank account

Account numbers must contain exactly 10 digits.

```ts
const banks = await fossapay.banks.list();
const account = await fossapay.banks.resolveAccount({
  bankCode: banks[0].code,
  accountNumber: "0123456789",
});
```

### 8. Create a payout

Payouts require an active live full access API key. Test API keys cannot initiate payouts.

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

The SDK supports individual payouts only.

### 9. Receive webhooks

Verify `x-fossapay-signature-v2` against the exact raw request body. Do not parse the body before verification.

```ts
import express from "express";

const app = express();

app.post(
  "/webhooks/fossapay",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
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
    } catch {
      res.sendStatus(400);
    }
  },
);

app.use(express.json());
```

Store `event.eventId` and ignore events already processed. Webhooks can be retried and may arrive more than once.

Supported events:

- `deposit.completed`
- `withdrawal.completed`
- `withdrawal.failed`
- `transfer.completed`
- `transfer.failed`
- `wallet.balance.updated`
- `checkout.completed`
- `checkout.failed`
- `checkout.expired`
- `checkout.reversed`
- `payout.completed`
- `payout.failed`
- `payout.reversed`

Direct signature verification is also available:

```ts
const rawBody = req.body as Buffer;
const signature = req.header("x-fossapay-signature-v2") ?? "";
const valid = fossapay.webhooks.verifySignature(
  rawBody,
  signature,
  process.env.FOSSAPAY_WEBHOOK_SECRET!,
);
```

## Idempotency and retries

Customer creation, wallet creation, payouts, and wallet transfers accept `idempotencyKey` and `timeoutMs`.

The SDK generates an idempotency key when one is omitted. Supply a stable key from your system if the request may be recreated in another process. Reuse a key only for the same operation and request body.

GET requests and idempotent write requests are retried after connection failures and retryable HTTP responses. Configure the retry count with `maxRetries`.

## Pagination

List methods accept `page` and `limit`. Customer lists return `result` and `pagination`. Business transaction lists return `data` and `meta`.

```ts
const page = await fossapay.transactions.list({ page: 1, limit: 20 });
console.log(page.data, page.meta);
```

## Error handling

```ts
import {
  FossaPayApiError,
  FossaPayConnectionError,
  WebhookSignatureError,
} from "@fossapay/node";

try {
  await fossapay.transactions.retrieve("UNKNOWN_ID");
} catch (error) {
  if (error instanceof FossaPayApiError) {
    console.log(error.status, error.code, error.requestId, error.message);
  } else if (error instanceof FossaPayConnectionError) {
    console.log(error.message, error.cause);
  }
}
```

`FossaPayApiError` represents an HTTP error returned by FossaPay. `FossaPayConnectionError` represents a timeout or connection failure. `WebhookSignatureError` represents an invalid signature, malformed event, or timestamp outside the configured tolerance.

## API reference

| Resource | Methods |
| --- | --- |
| `business` | `retrieve()` |
| `customers` | `create()`, `retrieve()`, `list()`, `listWallets()` |
| `wallets.fiat` | `create()`, `list()`, `getMaster()`, `retrieve()`, `retrieveByAccountNumber()`, `listTransactions()`, `retrieveTransaction()`, `transfer()` |
| `wallets.crypto` | `create()`, `createMaster()`, `list()`, `getMaster()`, `retrieve()`, `retrieveByAddress()`, `getCustomerBalance()`, `listTransactions()`, `retrieveTransaction()` |
| `collections` | `createAccount()`, `retrieveAccount()`, `retrieveAccountByNumber()`, `listTransactions()` |
| `transactions` | `list()`, `retrieve()` |
| `banks` | `list()`, `resolveAccount()` |
| `payouts` | `create()`, `retrieve()`, `retrieveByReference()` |
| `webhooks` | `constructEvent()`, `verifySignature()` |

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```
