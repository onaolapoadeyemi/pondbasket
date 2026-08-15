import { describe, expect, it } from "vitest";
import { presentCatalogItems } from "./catalogPresentation";

const items = [
  {
    species: "tilapia",
    form: "frozen",
    processing: "cut",
    farmer: "Green Creek",
    farmerArea: "Badore",
    sizeGrade: "large",
    unitPriceKobo: 1360000,
    availableQuantity: 18,
    availabilityType: "preorder",
  },
  {
    species: "catfish",
    form: "live",
    processing: "whole",
    farmer: "Akinola Pond",
    farmerArea: "Ajah",
    sizeGrade: "jumbo",
    unitPriceKobo: 1850000,
    availableQuantity: 9,
    availabilityType: "scheduled harvest",
  },
  {
    species: "catfish",
    form: "fresh",
    processing: "cleaned",
    farmer: "Akinola Pond",
    farmerArea: "Ibeju-Lekki",
    sizeGrade: "large",
    unitPriceKobo: 485000,
    availableQuantity: 48,
    availabilityType: "available now",
  },
] as const;

describe("presentCatalogItems", () => {
  it("matches meaningful catalog text and availability labels", () => {
    expect(
      presentCatalogItems(items, "badore", "all", "preorder", "recommended")
    ).toEqual([items[0]]);
  });

  it("keeps true availability distinct from scheduled and preorder listings", () => {
    expect(
      presentCatalogItems(items, "", "all", "available", "recommended")
    ).toEqual([items[2]]);
  });

  it("orders listings by integer-kobo price and freshness", () => {
    expect(
      presentCatalogItems(items, "", "all", "all", "price_low").map(
        item => item.unitPriceKobo
      )
    ).toEqual([485000, 1360000, 1850000]);
    expect(
      presentCatalogItems(items, "", "all", "all", "freshness").map(
        item => item.form
      )
    ).toEqual(["live", "fresh", "frozen"]);
  });

  it("filters by a listing's preparation without changing the server catalog query", () => {
    expect(
      presentCatalogItems(items, "", "cleaned", "all", "recommended")
    ).toEqual([items[2]]);
  });
});
