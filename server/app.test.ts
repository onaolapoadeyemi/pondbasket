import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("createApp", () => {
  it("returns a reusable Express application without binding a listener", () => {
    const app = createApp();

    expect(typeof app).toBe("function");
    expect(app.settings["trust proxy"]).toBe(true);
    expect(app._router).toBeUndefined();
  });
});
