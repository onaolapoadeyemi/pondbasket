import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATALOG_URL_STATE,
  parseCatalogUrlState,
  serializeCatalogUrlState,
} from "./catalogUrlState";

describe("catalog URL state", () => {
  it("parses a shareable filtered catalog URL and ignores unknown enum values", () => {
    expect(
      parseCatalogUrlState(
        "?zone=Chevron&species=tilapia&processing=cut&availability=preorder&sort=price_low&q=green%20creek&form=bad"
      )
    ).toEqual({
      zone: "Chevron",
      species: "tilapia",
      form: undefined,
      processing: "cut",
      fulfillment: undefined,
      availability: "preorder",
      sort: "price_low",
      search: "green creek",
    });
  });

  it("serializes only meaningful non-default catalog state", () => {
    expect(
      serializeCatalogUrlState({
        ...DEFAULT_CATALOG_URL_STATE,
        species: "catfish",
        fulfillment: "pickup",
        search: "ajà",
      })
    ).toBe("species=catfish&fulfillment=pickup&q=aj%C3%A0");
  });
});
