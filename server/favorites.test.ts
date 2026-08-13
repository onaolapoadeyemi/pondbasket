import { describe, expect, it } from "vitest";
import { canSaveFavorite, favoriteToggleOutcome } from "../shared/favorites";

describe("favorites behavior", () => {
  it("allows active and Demo Mode listings but rejects unavailable listings", () => {
    expect(canSaveFavorite(11, [11], [101, 102])).toBe(true);
    expect(canSaveFavorite(101, [11], [101, 102])).toBe(true);
    expect(canSaveFavorite(404, [11], [101, 102])).toBe(false);
  });

  it("returns save and remove outcomes deterministically", () => {
    expect(favoriteToggleOutcome()).toEqual({ saved: true });
    expect(favoriteToggleOutcome(88)).toEqual({ saved: false, removeId: 88 });
  });
});
