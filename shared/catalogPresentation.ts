export type CatalogPresentationItem = {
  species: string;
  form: string;
  processing: string;
  farmer: string;
  farmerArea: string;
  sizeGrade: string;
  unitPriceKobo: number;
  availableQuantity: number;
  availabilityType: string;
};

export type CatalogAvailabilityFilter =
  | "all"
  | "available"
  | "scheduled"
  | "preorder";

export type CatalogSort =
  | "recommended"
  | "price_low"
  | "price_high"
  | "availability_high"
  | "freshness";

const freshnessRank: Record<string, number> = {
  live: 0,
  fresh: 1,
  frozen: 2,
};

export function presentCatalogItems<T extends CatalogPresentationItem>(
  items: readonly T[],
  search: string,
  processing: string,
  availability: CatalogAvailabilityFilter,
  sort: CatalogSort
) {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedProcessing = processing.toLowerCase();
  const filtered = items.filter(item => {
    const searchable = [
      item.species,
      item.form,
      item.processing,
      item.farmer,
      item.farmerArea,
      item.sizeGrade,
    ]
      .join(" ")
      .toLowerCase();
    const availabilityLabel = item.availabilityType.toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 || searchable.includes(normalizedSearch);
    const matchesProcessing =
      normalizedProcessing === "all" ||
      item.processing.toLowerCase() === normalizedProcessing;
    const matchesAvailability =
      availability === "all" ||
      (availability === "available" &&
        item.availableQuantity > 0 &&
        availabilityLabel.includes("available")) ||
      (availability === "scheduled" &&
        availabilityLabel.includes("scheduled")) ||
      (availability === "preorder" && availabilityLabel.includes("preorder"));
    return matchesSearch && matchesProcessing && matchesAvailability;
  });

  return filtered.sort((left, right) => {
    if (sort === "price_low") return left.unitPriceKobo - right.unitPriceKobo;
    if (sort === "price_high") return right.unitPriceKobo - left.unitPriceKobo;
    if (sort === "availability_high") {
      return right.availableQuantity - left.availableQuantity;
    }
    if (sort === "freshness") {
      return (
        (freshnessRank[left.form.toLowerCase()] ?? 99) -
        (freshnessRank[right.form.toLowerCase()] ?? 99)
      );
    }
    return 0;
  });
}
