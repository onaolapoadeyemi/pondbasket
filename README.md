# PondBasket

**PondBasket** is an independent, consumer-facing Demo Mode marketplace for verified local farms to sell only **catfish** and **tilapia** in defined Nigerian service zones. It is deliberately separate from any business-procurement product and is not configured to accept real money.

## Demo Mode scope

| Capability | Demo Mode implementation | Production status |
|---|---|---|
| Customer accounts and private addresses | Account-authenticated customer profile and address procedures | Requires phone/SMS provider for phone-first verification |
| Farmer verification | Structured DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / SUSPENDED workflow | Requires identity, account-name, and legal-review controls |
| Catalog | Approved catfish and tilapia listings, zone-aware discovery, filters, quantity and processing details | Ready for controlled data onboarding |
| Checkout | Integer-kobo authoritative pricing, single-farmer cart boundary, atomic stock reservation and immutable pricing snapshot | Uses `MockPaymentProvider` workflow only |
| Fulfillment | Server-controlled order transitions, buyer-held hashed delivery PIN, delivery confirmation and disputes | Requires real delivery operations and independent identity checks |
| Notifications | In-app records plus explicit simulated email records | Requires approved email, SMS, and/or WhatsApp providers |
| Payouts | Pilot payout eligibility and administrator-recorded payout workflow | Automatic payouts remain disabled |

## Architecture

The project uses a TypeScript React client, Express/tRPC server, Drizzle ORM, and a managed MySQL-compatible database. The application is organized as a modular monolith: the shared domain module owns integer-kobo calculation, transition rules, and account masking; routers enforce identity and role boundaries; the database persists auditable marketplace records; and server storage integrates with the preconfigured S3-backed storage helper for farmer uploads.

| Layer | Responsibilities |
|---|---|
| `shared/brand.ts` | The authoritative product identity, Demo Mode state, service language, colors, and default commerce configuration |
| `shared/domain.ts` | Integer-kobo pricing, commission rounding, legal order transitions, and account masking |
| `drizzle/schema.ts` | Normalized profiles, addresses, applications, service zones, products, orders, snapshots, events, notifications, disputes, payouts, feature flags, legal acceptances, and data-rights requests |
| `server/routers.ts` | Validated and authorized marketplace procedures, including checkout, mock payment confirmation, delivery confirmation, disputes, operational settings, and storage upload |
| `client/src/pages/` | Responsive storefront, checkout, customer, farmer, administrator, and legal-policy experiences |

## Run and validate

```bash
pnpm check
pnpm test
pnpm build
pnpm dev
```

The project includes clearly fictional farmers, customers, addresses, products, orders, an open dispute, a payout-eligible order, and simulated notifications. Do not replace them with real identities, bank details, addresses, payment data, or legal assertions without the appropriate approvals.

## Demo walkthrough

Start at **Shop fish**, select a zone, and open a listing. The checkout displays an authoritative quote. An authenticated customer with a saved address can reserve the inventory with an idempotency key, complete an explicitly labeled mock payment, and observe the order’s protected-payment status. An approved farmer progresses the order through fulfillment states. At dispatch, the server creates a one-time, expiring, hashed delivery PIN. The customer confirms delivery after inspection or opens a dispute; an open dispute blocks a payout record.

## Production launch blockers

> **Do not activate real payments, refunds, transfers, or production legal claims in this project until the relevant approvals, credentials, operating procedures, and counsel review are completed.**

Production requires, at minimum, payment-provider approval for the marketplace model, verified business and bank accounts, a reviewed settlement and payout process, qualified Nigerian legal review of all published policies, verified farmer-operational controls, production notification credentials, incident response, delivery operations, and reconciliation testing. The app is designed to fail closed for financial uncertainty and does not silently substitute a mock operation for a requested production financial operation.

