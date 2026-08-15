import type {
  CatalogAvailabilityFilter,
  CatalogSort,
} from "./catalogPresentation";

export type CatalogUrlState = {
  zone: string;
  species?: "catfish" | "tilapia";
  form?: "live" | "fresh" | "frozen";
  processing: string;
  fulfillment?: "pickup" | "farmer_delivery" | "platform_delivery";
  availability: CatalogAvailabilityFilter;
  sort: CatalogSort;
  search: string;
};

export const DEFAULT_CATALOG_URL_STATE: CatalogUrlState = {
  zone: "Ajah",
  processing: "all",
  availability: "all",
  sort: "recommended",
  search: "",
};

const speciesValues = new Set(["catfish", "tilapia"]);
const formValues = new Set(["live", "fresh", "frozen"]);
const fulfillmentValues = new Set([
  "pickup",
  "farmer_delivery",
  "platform_delivery",
]);
const availabilityValues = new Set<CatalogAvailabilityFilter>([
  "all",
  "available",
  "scheduled",
  "preorder",
]);
const sortValues = new Set<CatalogSort>([
  "recommended",
  "price_low",
  "price_high",
  "availability_high",
  "freshness",
]);

export function parseCatalogUrlState(search: string): CatalogUrlState {
  const params = new URLSearchParams(search);
  const species = params.get("species") ?? undefined;
  const form = params.get("form") ?? undefined;
  const fulfillment = params.get("fulfillment") ?? undefined;
  const availability = params.get("availability") ?? "all";
  const sort = params.get("sort") ?? "recommended";
  return {
    zone: params.get("zone")?.trim() || DEFAULT_CATALOG_URL_STATE.zone,
    species: speciesValues.has(species ?? "")
      ? (species as CatalogUrlState["species"])
      : undefined,
    form: formValues.has(form ?? "")
      ? (form as CatalogUrlState["form"])
      : undefined,
    processing: params.get("processing")?.trim().toLowerCase() || "all",
    fulfillment: fulfillmentValues.has(fulfillment ?? "")
      ? (fulfillment as CatalogUrlState["fulfillment"])
      : undefined,
    availability: availabilityValues.has(
      availability as CatalogAvailabilityFilter
    )
      ? (availability as CatalogAvailabilityFilter)
      : "all",
    sort: sortValues.has(sort as CatalogSort)
      ? (sort as CatalogSort)
      : "recommended",
    search: params.get("q")?.trim() ?? "",
  };
}

export function serializeCatalogUrlState(state: CatalogUrlState) {
  const params = new URLSearchParams();
  if (state.zone !== DEFAULT_CATALOG_URL_STATE.zone)
    params.set("zone", state.zone);
  if (state.species) params.set("species", state.species);
  if (state.form) params.set("form", state.form);
  if (state.processing !== "all") params.set("processing", state.processing);
  if (state.fulfillment) params.set("fulfillment", state.fulfillment);
  if (state.availability !== "all")
    params.set("availability", state.availability);
  if (state.sort !== "recommended") params.set("sort", state.sort);
  if (state.search) params.set("q", state.search);
  return params.toString();
}
