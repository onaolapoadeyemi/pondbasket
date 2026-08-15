import {
  Check,
  Copy,
  Filter,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  ListingGridSkeleton,
  RequestError,
  RequestRefreshNotice,
} from "@/components/RequestFeedback";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { shareLink } from "@/lib/shareLink";
import { presentCatalogItems } from "@shared/catalogPresentation";
import {
  DEFAULT_CATALOG_URL_STATE,
  parseCatalogUrlState,
  serializeCatalogUrlState,
  type CatalogUrlState,
} from "@shared/catalogUrlState";
import { useLocation, useSearch } from "wouter";

const zones = ["Ajah", "Lekki Phase 1", "Chevron"];
export default function Shop() {
  const [, setLocation] = useLocation();
  const locationSearch = useSearch();
  const catalogState = useMemo(
    () => parseCatalogUrlState(locationSearch),
    [locationSearch]
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareState, setShareState] = useState<
    "idle" | "shared" | "copied" | "failed"
  >("idle");
  const recordShare = trpc.analytics.recordShare.useMutation();
  const updateCatalogState = (updates: Partial<CatalogUrlState>) => {
    const nextSearch = serializeCatalogUrlState({
      ...catalogState,
      ...updates,
    });
    setLocation(nextSearch ? `/shop?${nextSearch}` : "/shop", {
      replace: true,
    });
  };
  const input = useMemo(
    () => ({
      zone: catalogState.zone,
      species: catalogState.species,
      form: catalogState.form,
      fulfillment: catalogState.fulfillment,
      verifiedOnly: true,
    }),
    [
      catalogState.form,
      catalogState.fulfillment,
      catalogState.species,
      catalogState.zone,
    ]
  );
  const { data, isLoading, isFetching, error, refetch } =
    trpc.catalog.list.useQuery(input);
  const items = useMemo(
    () =>
      presentCatalogItems(
        data?.items ?? [],
        catalogState.search,
        catalogState.processing,
        catalogState.availability,
        catalogState.sort
      ),
    [catalogState, data?.items]
  );
  const reset = () => updateCatalogState(DEFAULT_CATALOG_URL_STATE);
  const shareCatalog = async () => {
    const url = new URL(window.location.href);
    url.pathname = "/shop";
    url.search = serializeCatalogUrlState(catalogState);
    const outcome = await shareLink({
      title: `Fresh fish in ${catalogState.zone} | PondBasket`,
      text: "Explore verified catfish and tilapia listings from local farms.",
      url: url.toString(),
    });
    if (outcome === "cancelled") return;
    const nextState = outcome === "unavailable" ? "failed" : outcome;
    setShareState(nextState);
    if (outcome === "shared" || outcome === "copied") {
      recordShare.mutate({ shareType: "catalog" });
    }
    window.setTimeout(() => setShareState("idle"), 2500);
  };
  return (
    <main className="container py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
          Fresh today
        </p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.07em] text-[#092b2a] sm:text-6xl">
          Fish in your zone.
        </h1>
        <p className="mt-5 text-base leading-7 text-[#52716c]">
          Only approved catfish and tilapia listings from verified farmers are
          shown.
        </p>
      </div>
      <div className="mt-9 flex flex-col gap-3 rounded-[22px] border border-[#092b2a]/10 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52716c]" />
          <input
            className="h-11 w-full rounded-xl bg-[#f6f4ec] pl-9 pr-3 text-sm outline-none placeholder:text-[#76938e]"
            placeholder="Search catfish or tilapia"
            value={catalogState.search}
            onChange={event =>
              updateCatalogState({ search: event.target.value })
            }
            aria-label="Search fish listings"
          />
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#177e73]" />
          <select
            value={catalogState.zone}
            onChange={event => updateCatalogState({ zone: event.target.value })}
            className="h-11 min-w-40 appearance-none rounded-xl bg-[#f6f4ec] py-2 pl-9 pr-3 text-sm font-bold outline-none"
          >
            {zones.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button
          onClick={() => setFiltersOpen(!filtersOpen)}
          variant="outline"
          className="h-11 rounded-xl border-[#092b2a]/15 text-[#092b2a]"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button
          onClick={shareCatalog}
          variant="outline"
          className="h-11 rounded-xl border-[#092b2a]/15 text-[#092b2a]"
          aria-live="polite"
        >
          {shareState === "shared" || shareState === "copied" ? (
            <Check className="mr-2 h-4 w-4 text-[#177e73]" />
          ) : shareState === "failed" ? (
            <Copy className="mr-2 h-4 w-4 text-[#9c3b24]" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          {shareState === "shared"
            ? "Shared"
            : shareState === "copied"
              ? "Link copied"
              : shareState === "failed"
                ? "Copy unavailable"
                : "Share"}
        </Button>
      </div>
      {filtersOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[22px] border border-[#092b2a]/10 bg-[#e8e7dc] p-4">
          <Filter className="h-4 w-4 text-[#177e73]" />
          <label className="text-xs font-bold text-[#52716c]">Species</label>
          <select
            value={catalogState.species ?? "all"}
            onChange={event =>
              updateCatalogState({
                species:
                  event.target.value === "all"
                    ? undefined
                    : (event.target.value as "catfish" | "tilapia"),
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="all">All fish</option>
            <option value="catfish">Catfish</option>
            <option value="tilapia">Tilapia</option>
          </select>
          <label className="text-xs font-bold text-[#52716c]">Form</label>
          <select
            value={catalogState.form ?? "all"}
            onChange={event =>
              updateCatalogState({
                form:
                  event.target.value === "all"
                    ? undefined
                    : (event.target.value as "live" | "fresh" | "frozen"),
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="all">Any form</option>
            <option value="fresh">Fresh</option>
            <option value="live">Live</option>
            <option value="frozen">Frozen</option>
          </select>
          <label className="text-xs font-bold text-[#52716c]">Processing</label>
          <select
            value={catalogState.processing}
            onChange={event =>
              updateCatalogState({ processing: event.target.value })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="all">Any processing</option>
            <option value="cleaned">Cleaned</option>
            <option value="whole">Whole</option>
            <option value="cut">Cut</option>
          </select>
          <label className="text-xs font-bold text-[#52716c]">
            Fulfillment
          </label>
          <select
            value={catalogState.fulfillment ?? "all"}
            onChange={event =>
              updateCatalogState({
                fulfillment:
                  event.target.value === "all"
                    ? undefined
                    : (event.target.value as
                        | "pickup"
                        | "farmer_delivery"
                        | "platform_delivery"),
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="all">Pickup or delivery</option>
            <option value="pickup">Pickup</option>
            <option value="farmer_delivery">Farmer delivery</option>
            <option value="platform_delivery">Platform delivery</option>
          </select>
          <label className="text-xs font-bold text-[#52716c]">
            Availability
          </label>
          <select
            value={catalogState.availability}
            onChange={event =>
              updateCatalogState({
                availability: event.target
                  .value as CatalogUrlState["availability"],
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="all">All timing</option>
            <option value="available">Available now</option>
            <option value="scheduled">Scheduled harvest</option>
            <option value="preorder">Preorder</option>
          </select>
          <label className="text-xs font-bold text-[#52716c]">Sort</label>
          <select
            value={catalogState.sort}
            onChange={event =>
              updateCatalogState({
                sort: event.target.value as CatalogUrlState["sort"],
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
            <option value="availability_high">Most available</option>
            <option value="freshness">Freshness: live to frozen</option>
          </select>
          <button
            onClick={reset}
            className="ml-auto flex items-center gap-1 text-xs font-bold text-[#0b4f4a]"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}
      {error ? (
        <RequestError
          className="mt-8"
          title="The catalog is taking a moment."
          detail={error.message}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm font-medium text-[#52716c]">
              {items.length} listing{items.length === 1 ? "" : "s"} available in{" "}
              <span className="font-bold text-[#092b2a]">
                {catalogState.zone}
              </span>
            </p>
            <div className="flex items-center gap-3">
              {isFetching && !isLoading ? (
                <RequestRefreshNotice label="Refreshing fish…" />
              ) : null}
              <p className="hidden text-xs text-[#76938e] sm:block">
                Prices shown in NGN · Delivery shown before payment
              </p>
            </div>
          </div>
          <div className="mt-5">
            {isLoading ? <ListingGridSkeleton /> : null}
            {!isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </div>
          {!isLoading && items.length === 0 && (
            <div className="mt-8 rounded-[24px] border border-dashed border-[#092b2a]/20 bg-white p-12 text-center">
              <p className="font-display text-2xl font-bold">
                Nothing matches yet.
              </p>
              <p className="mt-2 text-sm text-[#52716c]">
                Try a different zone or remove a filter.
              </p>
              <Button
                onClick={reset}
                className="mt-5 rounded-full bg-[#0b4f4a]"
              >
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
