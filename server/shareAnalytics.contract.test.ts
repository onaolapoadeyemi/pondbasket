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

  it("rejects a product share that omits its aggregate listing reference", async () => {
    await expect(
      caller().analytics.recordShare({ shareType: "product" } as any)
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
  });
});
