import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";

/**
 * Serves a prebuilt client and falls back to its SPA shell for client routes.
 * The optional directory keeps the function independent from Vite at runtime.
 */
export function serveStatic(app: Express, staticDirectory?: string) {
  const distPath =
    staticDirectory ??
    (process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public"));

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  app.use("/{*splat}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
