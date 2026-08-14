import { describe, expect, it } from "vitest";
import {
  assertOrderTransition,
  calculatePricing,
  maskBankAccount,
  FARMER_APPLICATION_STATES,
} from "../shared/domain";
import { PRODUCT_SPECIES } from "../shared/brand";

describe("PondBasket pricing integrity", () => {
  it("calculates the 10% founding-farmer commission in integer kobo", () => {
    const pricing = calculatePricing({
      unitPriceKobo: 485000,
      quantity: 2,
      commissionRateBps: 1000,
      deliveryChargeKobo: 130000,
      buyerServiceFeeKobo: 0,
    });
    expect(pricing).toMatchObject({
      subtotalKobo: 970000,
      commissionKobo: 97000,
      deliveryChargeKobo: 130000,
      buyerTotalKobo: 1100000,
      farmerPayoutKobo: 873000,
    });
  });

  it("calculates 12% and 15% commission tiers without floating-point money", () => {
    expect(
      calculatePricing({
        unitPriceKobo: 420000,
        quantity: 4,
        commissionRateBps: 1200,
        deliveryChargeKobo: 150000,
      }).commissionKobo
    ).toBe(201600);
    expect(
      calculatePricing({
        unitPriceKobo: 1850000,
        quantity: 2,
        commissionRateBps: 1500,
        deliveryChargeKobo: 160000,
      }).commissionKobo
    ).toBe(555000);
  });

  it("rejects non-integer monetary input", () => {
    expect(() =>
      calculatePricing({
        unitPriceKobo: 42.5,
        quantity: 1,
        commissionRateBps: 1000,
        deliveryChargeKobo: 0,
      })
    ).toThrow("integer");
  });

  it("includes an administrator-enabled buyer fee in the immutable buyer total", () => {
    const pricing = calculatePricing({
      unitPriceKobo: 420000,
      quantity: 2,
      commissionRateBps: 1000,
      deliveryChargeKobo: 130000,
      buyerServiceFeeKobo: 25000,
    });
    expect(pricing).toMatchObject({
      subtotalKobo: 840000,
      buyerServiceFeeKobo: 25000,
      buyerTotalKobo: 995000,
      farmerPayoutKobo: 756000,
    });
  });
});

describe("PondBasket order state machine", () => {
  it("allows only legal fulfillment transitions", () => {
    expect(() =>
      assertOrderTransition("PAID", "FARMER_ACCEPTED")
    ).not.toThrow();
    expect(() =>
      assertOrderTransition("FARMER_ACCEPTED", "PREPARING")
    ).not.toThrow();
    expect(() => assertOrderTransition("READY", "DISPATCHED")).not.toThrow();
  });

  it("blocks a delivery confirmation jump and a repeated completion", () => {
    expect(() =>
      assertOrderTransition("PAID", "DELIVERED_PENDING_RELEASE")
    ).toThrow("Illegal order transition");
    expect(() => assertOrderTransition("COMPLETED", "COMPLETED")).toThrow(
      "Illegal order transition"
    );
  });

  it("blocks payout-unsafe transitions from an open dispute", () => {
    expect(() => assertOrderTransition("DISPUTED", "FARMER_ACCEPTED")).toThrow(
      "Illegal order transition"
    );
  });

  it("requires dispatch before customer inspection can release delivery", () => {
    expect(() =>
      assertOrderTransition("READY", "DELIVERED_PENDING_RELEASE")
    ).toThrow("Illegal order transition");
    expect(() =>
      assertOrderTransition("DISPATCHED", "DELIVERED_PENDING_RELEASE")
    ).not.toThrow();
  });
});

describe("PondBasket catalog boundary", () => {
  it("exposes only the two approved launch species", () => {
    expect(PRODUCT_SPECIES).toEqual(["catfish", "tilapia"]);
    expect(PRODUCT_SPECIES).not.toContain("mackerel");
  });
});

describe("PondBasket private financial display", () => {
  it("masks all but the final four bank-account digits", () => {
    expect(maskBankAccount("0123456789")).toBe("••••••6789");
  });
});

describe("PondBasket farmer onboarding workflow", () => {
  it("keeps every required farmer verification state available to the application flow", () => {
    expect(FARMER_APPLICATION_STATES).toEqual([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "SUSPENDED",
    ]);
  });
});
