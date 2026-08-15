import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";

/**
 * Creates the HTTP application without starting a listener.
 *
 * The managed development server and the Vercel function both use this factory,
 * preserving identical OAuth, storage-proxy, request-body, and tRPC behavior.
 */
export function createApp() {
  const app = express();

  // Vercel and managed previews terminate TLS before forwarding requests. This
  // preserves the original HTTPS protocol for secure session-cookie decisions.
  app.set("trust proxy", true);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
