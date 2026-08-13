import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { getRecoveryFailure } from "./QueryRecoveryBanner";

describe("getRecoveryFailure", () => {
  it("returns a stable recovery snapshot for a failed query", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = ["catalog", "zone", "ajah"];

    await expect(client.fetchQuery({ queryKey, queryFn: async () => { throw new Error("Catalog unavailable"); } })).rejects.toThrow("Catalog unavailable");

    expect(getRecoveryFailure(client)).toEqual({
      key: JSON.stringify(queryKey),
      message: "Catalog unavailable",
      queryKey,
    });
  });

  it("returns null when the query cache has no failures", () => {
    expect(getRecoveryFailure(new QueryClient())).toBeNull();
  });
});
