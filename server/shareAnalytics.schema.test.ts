import { describe, expect, it } from "vitest";
import { shareEvents } from "../drizzle/schema";

describe("shareEvents privacy schema", () => {
  it("contains only aggregate share dimensions and timestamp metadata", () => {
    expect(shareEvents).toHaveProperty("id");
    expect(shareEvents).toHaveProperty("shareType");
    expect(shareEvents).toHaveProperty("productId");
    expect(shareEvents).toHaveProperty("createdAt");
  });

  it("excludes direct user, network, device, URL, and search-query identifiers", () => {
    expect(shareEvents).not.toHaveProperty("userId");
    expect(shareEvents).not.toHaveProperty("ipAddress");
    expect(shareEvents).not.toHaveProperty("deviceId");
    expect(shareEvents).not.toHaveProperty("url");
    expect(shareEvents).not.toHaveProperty("searchQuery");
  });
});
