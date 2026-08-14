import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  insertValues: [] as unknown[],
  deleteCalls: 0,
}));
const fakeDb = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: () => {
      const consume = () => Promise.resolve(state.selectResults.shift() ?? []);
      const query = {
        limit: consume,
        orderBy: consume,
        then: (
          resolve: (value: unknown[]) => unknown,
          reject: (reason: unknown) => unknown
        ) => consume().then(resolve, reject),
      };
      return { where: () => query, then: query.then };
    },
  })),
  insert: vi.fn(() => ({
    values: (value: unknown) => {
      state.insertValues.push(value);
      return Promise.resolve();
    },
  })),
  delete: vi.fn(() => ({
    where: () => {
      state.deleteCalls += 1;
      return Promise.resolve();
    },
  })),
}));

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));

import { appRouter } from "./routers";

const caller = () =>
  appRouter.createCaller({
    user: { id: 71, openId: "favorite-test", role: "customer" },
    req: {},
    res: {},
  } as any);
const profile = { id: 19, userId: 71, customerType: "individual" };

describe("customer favorites tRPC contract", () => {
  beforeEach(() => {
    state.selectResults = [];
    state.insertValues = [];
    state.deleteCalls = 0;
    vi.clearAllMocks();
  });

  it("saves an active listing and returns saved true", async () => {
    state.selectResults = [[profile], [{ id: 55 }], []];
    await expect(
      caller().customer.toggleFavorite({ productId: 55 })
    ).resolves.toEqual({ saved: true });
    expect(state.insertValues).toContainEqual({
      customerId: 19,
      productId: 55,
    });
  });

  it("removes an existing saved listing and returns saved false", async () => {
    state.selectResults = [[profile], [{ id: 55 }], [{ id: 93 }]];
    await expect(
      caller().customer.toggleFavorite({ productId: 55 })
    ).resolves.toEqual({ saved: false });
    expect(state.deleteCalls).toBe(1);
  });

  it("returns a customer’s saved product IDs", async () => {
    state.selectResults = [[profile], [{ productId: 55 }, { productId: 56 }]];
    await expect(caller().customer.favoriteIds()).resolves.toEqual([55, 56]);
  });

  it("returns saved live listings with current catalog details", async () => {
    state.selectResults = [
      [profile],
      [{ productId: 55 }],
      [
        {
          id: 55,
          farmerApplicationId: 7,
          species: "catfish",
          form: "fresh",
          processing: "cleaned",
          sizeGrade: "large",
          unit: "kg",
          unitPriceKobo: 420000,
          minOrder: 1,
          availableQuantity: 20,
          reservedQuantity: 2,
          availabilityType: "available_now",
          availabilityDate: null,
          zonesJson: ["Ajah"],
          fulfillmentJson: ["pickup"],
          description: "Freshly harvested catfish.",
        },
      ],
      [{ id: 7, farmName: "Test Pond", generalFarmArea: "Ajah" }],
      [],
    ];
    const result = await caller().customer.favorites();
    expect(result.items).toEqual([
      expect.objectContaining({
        id: 55,
        farmer: "Test Pond",
        availableQuantity: 18,
        species: "catfish",
      }),
    ]);
  });

  it("rejects an unavailable listing", async () => {
    state.selectResults = [[profile], []];
    await expect(
      caller().customer.toggleFavorite({ productId: 999999 })
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });
  });
});
