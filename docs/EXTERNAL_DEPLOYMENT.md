# External Deployment Guide

## Scope

PondBasket now includes a **Vercel-ready serverless adaptation**. The production Express application is created by `server/app.ts` without binding a port. The managed server starts that app through `server/_core/index.ts`; Vercel loads the same app from the default export in `api/index.ts`.

The Vercel build command, `pnpm build:vercel`, writes the Vite client into the ignored root `public/` directory. `vercel.json` serves that output and rewrites API, storage-proxy, and client-side routes to the Vercel function. The local `pnpm smoke:vercel` command builds that output and confirms the function returns the PondBasket client shell.

> **No external deployment has been performed.** Import the repository into your own Vercel account and configure secrets there. Do not commit runtime secrets or export managed platform credentials.

## Vercel deployment

Vercel treats the default export from `api/index.ts` as one Node.js Express function, while static files are served from `public/**`. [1]

| Vercel setting              | PondBasket value                 |
| --------------------------- | -------------------------------- |
| Install command             | `pnpm install --frozen-lockfile` |
| Build command               | `pnpm build:vercel`              |
| Output directory            | `public`                         |
| Function entry              | `api/index.ts`                   |
| Local deployment smoke test | `pnpm smoke:vercel`              |

Create a Vercel project by importing `onaolapoadeyemi/pondbasket`. The committed `vercel.json` supplies the build, output, function, and rewrite configuration. Configure the following server-side values for **Preview** and **Production** before deploying:

| Configuration area          | Required values                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Database                    | `DATABASE_URL` for the target MySQL-compatible deployment database                                               |
| Session and OAuth           | `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`                                         |
| Managed service integration | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` |
| Ownership and analytics     | `OWNER_OPEN_ID`, `OWNER_NAME`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`                            |
| Application identity        | `VITE_APP_ID`, `VITE_APP_TITLE`, `VITE_APP_LOGO`                                                                 |

The exact values must come from the production services that replace or remain compatible with the current managed project configuration. Update the OAuth provider’s allowlist with the deployed callback URL:

```text
https://YOUR-VERCEL-DOMAIN/api/oauth/callback
```

Then use Vercel’s authenticated project interface to create the deployment. Validate sign-in, a protected tRPC request, product-image upload, private document access, storage redirects, and a database-backed order workflow in a preview deployment before promoting it.

## Netlify follow-up

Netlify’s Express integration runs the application through a Netlify Function. Its documented pattern wraps Express with `serverless-http` and uses redirects to route API paths to that function. [2]

PondBasket does not yet include that Netlify-specific wrapper because deploying it unchanged would require an additional dependency, a `netlify/functions` entry, a `netlify.toml` function/redirect configuration, and platform-specific preview tests. Reuse `server/app.ts` as the shared application factory when implementing that adapter. The same environment, OAuth callback, database, S3-backed storage, and request-size checks listed for Vercel still apply.

## External-hosting limitations

The project’s storage and notification helpers currently use managed Forge endpoints. Those values must remain available and permitted from the external host, or they must be replaced with equivalent production integrations before launch. The app is stateless at the Express layer; do not rely on function memory for sessions, carts, uploads, or background work.

## Validation checklist

Run these checks before opening an external-hosting pull request:

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm smoke:vercel
pnpm audit --prod --audit-level=low
```

## References

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[2]: https://docs.netlify.com/build/frameworks/framework-setup-guides/express/ "Express on Netlify"
