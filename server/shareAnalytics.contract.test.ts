import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  insertValues: [] as unknown[],
}));

const fakeDb = vi.hoisted(() => ({
  insert: vi.fn(() => ({
    values: (value: unknown) => {
      state.insertValues.push(value);
      return Promise.resolve();
    },
  })),
}));

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));

import { appRouter } from "./routers";

const caller = () =>
  appRouter.createCaller({ user: null, req: {}, res: {} } as any);

describe("aggregate share analytics tRPC contract", () => {
  beforeEach(() => {
    state.insertValues = [];
    vi.clearAllMocks();
  });

  it("records a catalog share without identity, URL, query, or device fields", async () => {
    await expect(
      caller().analytics.recordShare({ shareType: "catalog" })
    ).resolves.toEqual({ recorded: true });

    expect(state.insertValues).toEqual([{ shareType: "catalog" }]);
  });

  it("records only the shared product ID for a product-link share", async () => {
    await expect(
      caller().analytics.recordShare({ shareType: "product", productId: 55 })
    ).resolves.toEqual({ recorded: true });

    expect(state.insertValues).toEqual([
      { shareType: "product", productId: 55 },
    ]);
  });

  it("hashes an anonymous campaign token instead of storing its raw value", async () => {
    await expect(
      caller().analytics.recordShare({
        shareType: "product",
        productId: 55,
        campaignToken: "123e4567-e89b-42d3-a456-426614174000",
      })
    ).resolves.toEqual({ recorded: true });

    expect(state.insertValues[0]).toMatchObject({
      shareType: "product",
      productId: 55,
      campaignTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(JSON.stringify(state.insertValues[0])).not.toContain(
      "123e4567-e89b-42d3-a456-426614174000"
    );
  });

  it("rejects a product share that omits its aggregate listing reference", async () => {
    await expect(
      caller().analytics.recordShare({ shareType: "product" } as any)
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
  });
});
