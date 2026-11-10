# FossaPay SDK Changelog

All notable changes to the official FossaPay developer SDKs are documented in
this file.

This changelog covers:

- [`@fossapay/node`](https://www.npmjs.com/package/@fossapay/node) — the
  server-side SDK for businesses, customers, wallets, collections, payouts,
  transactions, transaction splits, and webhooks.
- [`@fossapay/checkout`](https://www.npmjs.com/package/@fossapay/checkout) —
  the server, browser, and React SDK for creating and presenting FossaPay
  Checkout.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and both packages follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Because both SDKs are currently below `1.0.0`, minor releases may introduce
meaningful additions to the public API. Review the relevant release notes before
upgrading.

## Latest platform update — 10 November 2026

FossaPay's official SDKs now provide an end-to-end integration path for
businesses building payment products in Node.js, TypeScript, React, or browser
applications.

Developers can now:

- Create customers and dedicated NGN or supported stablecoin wallets.
- Receive and inspect collections and wallet transactions.
- Resolve Nigerian bank accounts and initiate live NGN payouts.
- Create hosted payment links and single-order checkout sessions from a secure
  server environment.
- Present Checkout as a modal, inline frame, redirect, new tab, React component,
  or browser script.
- Create reusable NGN transaction splits, configure recipients and fee handling,
  assign splits to checkout sources, and inspect split transactions.
- Verify signed FossaPay webhook events before fulfilling an order or updating
  an internal balance.

### Install or upgrade

```bash
npm install @fossapay/node@latest
npm install @fossapay/checkout@latest
```

Use `@fossapay/node` and `@fossapay/checkout/server` only in trusted server
environments. Never expose a FossaPay API key or webhook secret in browser code.

---

## `@fossapay/node`

### Unreleased

- No unreleased changes.

### [0.1.2] — 10 November 2026

#### Changed

- Published the current stable package metadata as `0.1.2`.
- No public SDK methods or request contracts changed from `0.1.1`.

### [0.1.1] — 10 November 2026

#### Added

##### Transaction splits

- Added `fossapay.splits.create()` for creating reusable NGN percentage or flat
  splits.
- Added `fossapay.splits.list()` and `fossapay.splits.retrieve()` for discovering
  splits and retrieving complete split configuration by split code.
- Added `fossapay.splits.update()` for changing a split's name, collection
  methods, flat-rule minimum payment amount, and fee-payer configuration.
- Added recipient management for supported subaccounts and external Nigerian
  bank accounts:
  - `addRecipient()`
  - `updateRecipient()`
  - `removeRecipient()`
- Added `preview()` so an integration can inspect eligibility, platform fees,
  recipient allocations, and the master-wallet remainder before processing a
  payment.
- Added `activate()` and `pause()` for controlling whether a split can process
  eligible collections.
- Added `listSources()` and `updateSources()` for assigning a checkout split to
  products, storefronts, and one or more payment links.
- Added `listTransactions()` for retrieving transactions processed under a
  split.
- Exported the transaction-split request, response, recipient, source, preview,
  fee-payer, collection-type, and allocation types for TypeScript users.

##### Release workflow

- Added patch, minor, and major release commands for consistent npm versioning.

#### Supported split behavior

- Transaction splits currently use NGN.
- Split allocation can be percentage-based or flat.
- Collection eligibility can include Checkout, direct deposit, or both.
- Platform fees can be charged to the master wallet, distributed evenly, or
  assigned to a specific recipient.
- A split code can be reused at supported checkout entry points instead of
  recreating recipient rules per transaction.

### [0.1.0] — 19 October 2026

First stable release of the FossaPay Node SDK.

#### Added

##### Business access

- Retrieve the authenticated business and its current API environment with
  `fossapay.business.retrieve()`.

##### Customer management

- Create, retrieve, search, sort, and paginate business customers.
- Retrieve all wallets belonging to a customer.
- Support caller-provided idempotency keys for safely retrying customer creation.

##### NGN wallets and collections

- Create dedicated NGN customer wallets and collection accounts.
- Retrieve a fiat wallet by ID or account number.
- Retrieve the authenticated business's master fiat wallet.
- List and retrieve fiat wallet transactions.
- Transfer NGN between supported customer wallets.

##### Stablecoin wallets

- Create customer wallets on supported Solana and Stellar networks.
- Create and retrieve master stablecoin wallets.
- Retrieve a wallet by ID or blockchain address.
- Inspect customer balances and wallet transaction history.
- Preserve asset-denominated balances and transactions without forced NGN
  conversion.

##### Transactions

- List business transactions with pagination and filters for type, currency,
  status, reference, network, amount range, payment link, and date range.
- Retrieve an individual transaction by ID.

##### Bank resolution and payouts

- List supported Nigerian banks.
- Resolve a 10-digit bank account before initiating a payout.
- Create a live NGN payout with recipient and metadata fields.
- Retrieve a payout by payout ID or business reference.
- Enforce live full-access API keys for payout initiation; test payouts are not
  supported.

##### Webhooks

- Verify FossaPay webhook signatures against the unmodified raw request body.
- Construct typed webhook event envelopes with configurable timestamp tolerance.
- Support collection, transfer, wallet, checkout, withdrawal, and payout event
  families.
- Expose event IDs so integrations can implement idempotent webhook processing.

##### Reliability and developer experience

- Added automatic idempotency keys for supported write operations, with support
  for stable application-generated keys.
- Added retry handling for safe GET and idempotent write requests.
- Added configurable request timeouts, retry counts, base URLs, and Fetch API
  implementations.
- Added CommonJS and ECMAScript module builds with TypeScript declarations.
- Added structured API, connection, and webhook-signature error classes.

---

## `@fossapay/checkout`

### Unreleased

- No unreleased changes.

### [0.2.3] — 10 November 2026

#### Changed

- Published the current stable package metadata as `0.2.3`.
- No public SDK methods or checkout presentation contracts changed from `0.2.2`.

### [0.2.2] — 10 November 2026

#### Changed

- Published updated package version metadata.
- No public SDK methods or checkout presentation contracts changed from `0.2.1`.

### [0.2.1] — 10 November 2026

#### Added

##### Server-side payment links

- Added the `@fossapay/checkout/server` entry point.
- Added `paymentLinks.create()` for creating fixed or variable payment links from
  an application's backend.
- Added support for NGN, USDC, and USDT payment-link currencies.
- Added customer-information collection, fee-bearer selection, expiration, and
  idempotency options during payment-link creation.
- Added payment-link retrieval, listing, activation, and deactivation.
- Exposed the hosted `checkoutUrl` returned by FossaPay for safe use by a browser
  or React frontend.
- Added reusable fixed payment links for collecting multiple payments without
  creating a new link for every payer.

##### Order checkout sessions

- Added `checkouts.create()` for initializing a single NGN order checkout with a
  unique business reference.
- Added customer, metadata, description, fee-bearer, and idempotency fields.
- Added checkout retrieval by ID and business reference.
- Added explicit checkout expiration.
- Added typed checkout amounts, fees, settlement values, lifecycle timestamps,
  transaction IDs, and generated account details.
- Added support for temporary, permanent, and order-scoped account response
  types without requiring integrations to understand FossaPay's internal account
  provisioning strategy.

##### Transaction splits

- Added the complete reusable NGN transaction-split management surface available
  in `@fossapay/node`.
- Added `splitCode` to payment-link and checkout creation.
- Added split metadata to payment-link and checkout responses so integrations can
  confirm the split attached to a payment source.
- Retained `splitId` on checkout initialization for compatibility while making
  `splitCode` the preferred public identifier.

##### Webhooks

- Added webhook signature verification to the server entry point.
- Added signed event construction using the raw request payload and
  `x-fossapay-signature-v2`.
- Added a payment-link identity check before delivering an incoming Checkout
  success event to the embedded checkout instance.

##### Release workflow

- Added patch, minor, and major release commands for consistent npm versioning.

#### Security

- API-key operations are isolated in the server-only package export.
- Browser messages are validated against the checkout origin and expected
  payment-link identity.
- Integrators should treat browser callbacks as interface updates and verify
  successful payments on their server or through a signed webhook before
  delivering value.

#### Compatibility

- Existing browser, React, and script-tag integrations remain supported.
- Existing applications can continue opening a pre-created payment-link reference
  or URL.
- Server-side payment-link creation, order checkouts, splits, and webhook
  verification are additive capabilities.

### [0.1.0] — 9 October 2026

Initial embeddable Checkout SDK release.

#### Added

- Open hosted FossaPay Checkout in modal, inline, redirect, or new-tab mode.
- Browser and TypeScript entry points for framework-independent applications.
- `FossaPayCheckoutButton` for React applications.
- Script-tag bundle for applications that do not use a package manager.
- Checkout lifecycle callbacks for ready, success, failure, reversal, expiration,
  and close events.
- Programmatic checkout controllers for closing, destroying, and retrieving the
  current hosted Checkout URL.
- Optional automatic modal close after a successful Checkout event.

---

## Upgrade guidance

### Node SDK

```bash
npm install @fossapay/node@latest
```

No migration is required when upgrading from `0.1.1` to `0.1.2`. Applications
upgrading from `0.1.0` can begin using `fossapay.splits` without changing their
existing customer, wallet, transaction, payout, or webhook integrations.

### Checkout SDK

```bash
npm install @fossapay/checkout@latest
```

Existing browser imports remain valid:

```ts
import { openCheckout } from "@fossapay/checkout";
```

Server-side capabilities use the dedicated export:

```ts
import { FossaPay } from "@fossapay/checkout/server";
```

Do not import the server entry point into browser code.

## Operational recommendations

- Pin an exact or compatible SDK version according to your release policy.
- Use a stable idempotency key whenever your server may retry the same write
  operation.
- Verify webhook signatures using the exact raw body received from FossaPay.
- Store processed webhook event IDs to prevent duplicate fulfilment.
- Confirm the final transaction state server-side before shipping goods,
  granting access, or crediting an external balance.
- Keep API keys and webhook secrets in environment variables or a managed secret
  store.

[0.1.2]: https://github.com/FossaOrg/fossapay-node/releases/tag/v0.1.2
[0.1.1]: https://github.com/FossaOrg/fossapay-node/releases/tag/v0.1.1
[0.1.0]: https://github.com/FossaOrg/fossapay-node/releases/tag/v0.1.0
[0.2.3]: https://github.com/FossaOrg/fossapay-checkout-sdk/releases/tag/v0.2.3
[0.2.2]: https://github.com/FossaOrg/fossapay-checkout-sdk/releases/tag/v0.2.2
[0.2.1]: https://github.com/FossaOrg/fossapay-checkout-sdk/releases/tag/v0.2.1
