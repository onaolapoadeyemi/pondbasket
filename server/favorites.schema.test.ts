import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { customerFavorites } from "../drizzle/schema";

describe("customer favorites schema", () => {
  it("stores a customer-to-product save relationship", () => {
    expect(getTableName(customerFavorites)).toBe("customerFavorites");
    expect(customerFavorites.customerId.name).toBe("customerId");
    expect(customerFavorites.productId.name).toBe("productId");
  });
});
