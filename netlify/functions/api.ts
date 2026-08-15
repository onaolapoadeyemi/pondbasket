import "dotenv/config";
import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { createApp } from "../../server/app";
import { serveStatic } from "../../server/_core/static";

const app = createApp();
serveStatic(app, `${process.cwd()}/public`);

// Netlify Functions use an event-based handler while preserving the original
// Express routes through redirects in netlify.toml.
export const handler = serverless(app) as unknown as Handler;
