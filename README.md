# PondBasket

PondBasket is a mobile-first **Demo Mode** marketplace for fresh catfish and tilapia from verified local farms in defined Nigerian service zones. It supports customer, farmer, and administrator roles, but deliberately excludes real payments, bank transfers, and production notifications.

> **Demo Mode only.** Listings, payments, notifications, and operational data are fictional. Do not enter real bank, payment, identity, or legal data without the necessary production approvals.

## Technology

| Area                 | Implementation                                       |
| -------------------- | ---------------------------------------------------- |
| Client               | React 19, TypeScript, Tailwind CSS 4, Vite           |
| Server               | Express 5 and tRPC 11                                |
| Data                 | Drizzle ORM with a MySQL-compatible database         |
| Identity and storage | Manus OAuth and S3-backed file storage helpers       |
| Quality              | ESLint, Prettier, Vitest, TypeScript, GitHub Actions |

## Prerequisites

Use **Node.js 22** and the pnpm version declared in `package.json`. The repository locks dependencies with `pnpm-lock.yaml`; keep it committed whenever dependencies change.

```bash
git clone https://github.com/onaolapoadeyemi/pondbasket.git
cd pondbasket
pnpm install --frozen-lockfile
pnpm dev
```

The development server starts on the platform-assigned port. Open the local preview URL shown by the development command.

## Environment and local services

PondBasket expects a MySQL-compatible database plus OAuth and storage configuration. In the managed project environment, these values are injected automatically. For a standalone deployment, provide the equivalent server-side configuration securely through the hosting provider rather than committing an `.env` file.

| Configuration area  | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| Database            | Marketplace data, orders, audit events, and favorites |
| OAuth               | User authentication and session handling              |
| Object storage      | Product photos and private farmer verification files  |
| Application secrets | Session signing and server-to-server API access       |

Review `server/_core/env.ts`, `server/_core/oauth.ts`, and `server/storage.ts` before configuring a non-managed environment. Run schema migrations only against the intended database after reviewing generated SQL.

```bash
pnpm drizzle-kit generate
# Review the migration SQL, then apply it through the approved database workflow.
```

## Common commands

| Command                               | Purpose                                             |
| ------------------------------------- | --------------------------------------------------- |
| `pnpm dev`                            | Start the local development server and Vite client  |
| `pnpm lint`                           | Run ESLint with zero warnings allowed               |
| `pnpm format:check`                   | Verify Prettier formatting without changing files   |
| `pnpm format`                         | Apply Prettier formatting                           |
| `pnpm check`                          | Run TypeScript type checking                        |
| `pnpm test`                           | Run the Vitest suite                                |
| `pnpm build`                          | Build the browser bundle and server entry point     |
| `pnpm build:vercel`                   | Build the Vercel static client output into `public` |
| `pnpm smoke:vercel`                   | Build and smoke-test the Vercel function locally    |
| `pnpm audit --prod --audit-level=low` | Audit production dependencies                       |

## Validation standard

Before opening a pull request, run:

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm audit --prod --audit-level=low
```

GitHub Actions enforces two separate checks on pull requests and `main`:

| Check                | Gate                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Build and Test**   | Formatting, linting, TypeScript, tests, and production build                          |
| **Dependency Audit** | All production vulnerabilities and high/critical findings across the dependency graph |

The `main` branch is protected: the successful **Audit dependencies** and **Build and test** jobs are required before merge, administrators are included, branches must be current, and force pushes or deletion are blocked.

## Marketplace architecture

| Path                 | Responsibility                                                                       |
| -------------------- | ------------------------------------------------------------------------------------ |
| `shared/brand.ts`    | Product identity, Demo Mode state, colors, and marketplace defaults                  |
| `shared/domain.ts`   | Integer-kobo pricing, commission calculations, transition rules, and account masking |
| `drizzle/schema.ts`  | Normalized marketplace tables and constraints                                        |
| `server/routers.ts`  | Authenticated and role-gated tRPC marketplace procedures                             |
| `client/src/pages/`  | Storefront, customer hub, farmer portal, admin console, and policy views             |
| `.github/workflows/` | Dependency audit and build-and-test CI quality gates                                 |

The catalog is intentionally limited to **catfish** and **tilapia**. Monetary values remain integer kobo from quote to immutable order snapshot. Customer carts remain limited to one farmer, and delivery completion requires the buyer-controlled PIN.

## Deployment guidance

**Recommended: use the project’s built-in hosting and publish from the project interface.** It is already aligned with the managed database, OAuth, storage, and platform secrets. Before launch, complete the production readiness items in the next section.

PondBasket now includes a Vercel serverless adaptation: `server/app.ts` creates a reusable Express application; `api/index.ts` default-exports that application for Vercel; `pnpm build:vercel` produces the root `public/**` client output; and `vercel.json` supplies the function, build, output, and rewrite configuration. The Vercel function has a local build-and-response smoke test through `pnpm smoke:vercel`. Vercel serves Express as a single function and serves static files from `public/**`. [1]

| Provider | Compatibility assessment                                                                                                                                    | Required work before user-initiated deployment                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel   | Configured and locally smoke-tested; ready for a user-initiated deployment once production environment values and OAuth callback allowlisting are in place. | Import the repository, configure the documented environment values, allowlist `https://YOUR-DOMAIN/api/oauth/callback`, and validate sign-in, database, uploads, and signed storage access in a preview. |
| Netlify  | Not yet configured; the shared Express factory is ready for a Netlify Function adapter. [2]                                                                 | Add `serverless-http`, a Netlify function wrapper, `netlify.toml` redirects, and platform-preview tests for OAuth, database, and S3-backed storage.                                                      |

No Vercel or Netlify deployment has been attempted. See [`docs/EXTERNAL_DEPLOYMENT.md`](docs/EXTERNAL_DEPLOYMENT.md) for the exact Vercel configuration, required environment categories, validation commands, and Netlify follow-up work. Deploy only through the provider’s authenticated interface after its production integrations are configured.

## Production launch blockers

> Do not activate real payments, refunds, transfers, or production legal claims until relevant approvals, credentials, operating procedures, and counsel review are complete.

At minimum, production requires payment-provider approval, verified business and payout accounts, farmer identity and operational controls, reviewed Nigerian legal policies, real notification credentials, delivery operations, reconciliation processes, incident response, and end-to-end testing.

## References

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[2]: https://docs.netlify.com/build/frameworks/framework-setup-guides/express/ "Express on Netlify"
