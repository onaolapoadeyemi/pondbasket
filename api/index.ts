import "dotenv/config";
import path from "node:path";
import { createApp } from "../server/app";
import { serveStatic } from "../server/_core/static";

// Vercel loads the default export as one Node.js serverless function. Static
// files are served from the generated root public directory; the SPA fallback
// remains available for client-side routes that are rewritten to this handler.
const app = createApp();
serveStatic(app, path.resolve(process.cwd(), "public"));

export default app;
