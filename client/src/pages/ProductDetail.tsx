import { useAuth } from "@/_core/hooks/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatNgn, type CatalogItem } from "@/components/ProductCard";
import {
  RequestError,
  RequestRefreshNotice,
} from "@/components/RequestFeedback";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

export default function ProductDetail() {
  const [, params] = useRoute("/shop/:id");
  const [, setLocation] = useLocation();
  const productId = Number(params?.id);
  const { line, add } = useCart();
  const { isAuthenticated } = useAuth();
  const catalog = trpc.catalog.list.useQuery();
  const product = catalog.data?.items.find(item => item.id === productId);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [zone, setZone] = useState("Ajah");
  const effectiveQuantity = quantity ?? product?.minOrder ?? 1;
  const quoteInput = useMemo(
    () =>
      product ? { productId, quantity: effectiveQuantity, zone } : undefined,
    [product, productId, effectiveQuantity, zone]
  );
  const quote = trpc.catalog.quote.useQuery(quoteInput as any, {
    enabled: Boolean(quoteInput),
  });

  if (catalog.isLoading)
    return (
      <main className="container py-14">
        <div className="h-[520px] animate-pulse rounded-[30px] bg-[#e8e7dc]" />
      </main>
    );
  if (catalog.error)
    return (
      <main className="container py-14">
        <RequestError
          title="This listing could not be loaded."
          detail={catalog.error.message}
          onRetry={() => catalog.refetch()}
          isRetrying={catalog.isFetching}
        />
      </main>
    );
  if (!product)
    return (
      <main className="container py-14">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b4f4a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>
        <h1 className="font-display mt-8 text-5xl font-bold">
          Listing unavailable.
        </h1>
      </main>
    );
  const addToBasket = () => {
    add({
      product: product as CatalogItem,
      quantity: effectiveQuantity,
      zone,
      purpose: "home_meal",
    });
    setLocation("/cart");
  };
  const productClass =
    product.species === "catfish" ? "bg-[#0b4f4a]" : "bg-[#d6e46b]";

  return (
    <main className="container py-8 sm:py-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#0b4f4a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to fresh fish
      </Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
        <section>
          <div
            className={`relative h-80 overflow-hidden rounded-[30px] ${productClass}`}
          >
            <div className="absolute -right-10 top-4 h-56 w-56 rounded-full border-[28px] border-white/15" />
            <div className="absolute left-7 top-7 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#0b4f4a]">
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
              Verified farmer
            </div>
            <div className="absolute bottom-7 left-7">
              <p className="font-display text-6xl font-bold tracking-[-.08em] text-white">
                {product.species}
              </p>
              <p className="mt-2 text-sm font-bold capitalize text-[#d6e46b]">
                {product.form} · {product.processing} · {product.sizeGrade}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-[22px] border border-[#092b2a]/10 bg-white p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#177e73]">
                  From a verified farm
                </p>
                <h1 className="font-display mt-2 text-3xl font-bold tracking-[-.05em]">
                  {product.farmer}
                </h1>
                <p className="mt-2 flex items-center gap-1 text-sm text-[#52716c]">
                  <MapPin className="h-4 w-4 text-[#177e73]" />
                  {product.farmerArea} · General farm area only
                </p>
              </div>
              <FavoriteButton productId={product.id} />
            </div>
            <p className="mt-5 text-sm leading-6 text-[#52716c]">
              {product.description}
            </p>
            <div className="mt-6 grid gap-3 border-t border-[#092b2a]/8 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#76938e]">
                  Availability
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm font-bold">
                  <Clock3 className="h-4 w-4 text-[#177e73]" />
                  {product.availabilityDate}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#76938e]">
                  Minimum order
                </p>
                <p className="mt-2 text-sm font-bold">
                  {product.minOrder} {product.unit}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#76938e]">
                  Fulfillment
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm font-bold capitalize">
                  <Truck className="h-4 w-4 text-[#177e73]" />
                  {product.fulfillment[0].replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </section>
        <aside className="h-fit rounded-[28px] border border-[#092b2a]/10 bg-white p-6 shadow-[0_12px_30px_rgba(9,43,42,.07)]">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#177e73]">
            Order details
          </p>
          <div className="mt-5 flex items-end justify-between">
            <p className="font-display text-3xl font-bold tracking-[-.05em]">
              {formatNgn(product.unitPriceKobo)}
              <span className="font-sans text-sm font-normal text-[#52716c]">
                {" "}
                / {product.unit}
              </span>
            </p>
            <span className="rounded-full bg-[#e8e7dc] px-3 py-1 text-xs font-bold capitalize">
              {product.sizeGrade}
            </span>
          </div>
          <div className="mt-6 border-y border-[#092b2a]/8 py-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#52716c]">
              Quantity
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() =>
                  setQuantity(Math.max(product.minOrder, effectiveQuantity - 1))
                }
                className="grid h-10 w-10 place-items-center rounded-full bg-[#e8e7dc]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-display text-2xl font-bold">
                {effectiveQuantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(product.availableQuantity, effectiveQuantity + 1)
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-full bg-[#d6e46b]"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-[#52716c]">{product.unit}</span>
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[#52716c]">
              Service zone
              <select
                value={zone}
                onChange={event => setZone(event.target.value)}
                className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case outline-none"
              >
                <option>Ajah</option>
                <option>Lekki Phase 1</option>
                <option>Chevron</option>
              </select>
            </label>
          </div>
          {quote.data && (
            <div className="mt-5 space-y-3 rounded-2xl bg-[#f6f4ec] p-4 text-sm">
              <div className="flex justify-between text-[#52716c]">
                <span>Fish subtotal</span>
                <span>{formatNgn(quote.data.pricing.subtotalKobo)}</span>
              </div>
              <div className="flex justify-between text-[#52716c]">
                <span>Delivery</span>
                <span>{formatNgn(quote.data.pricing.deliveryChargeKobo)}</span>
              </div>
              <div className="flex justify-between border-t border-[#092b2a]/10 pt-3 font-bold">
                <span>Buyer total</span>
                <span>{formatNgn(quote.data.pricing.buyerTotalKobo)}</span>
              </div>
            </div>
          )}
          {quote.error ? (
            <RequestError
              className="mt-5"
              title="The delivery quote could not be refreshed."
              detail={quote.error.message}
              onRetry={() => quote.refetch()}
              isRetrying={quote.isFetching}
            />
          ) : quote.isFetching ? (
            <div className="mt-5">
              <RequestRefreshNotice label="Updating delivery quote…" />
            </div>
          ) : null}
          <Button
            onClick={addToBasket}
            className="mt-6 w-full rounded-full bg-[#0b4f4a]"
          >
            {line ? "Replace basket & review" : "Add to basket"}
          </Button>
          {!isAuthenticated && (
            <Button
              onClick={startLogin}
              variant="outline"
              className="mt-3 w-full rounded-full"
            >
              Sign in to reserve this fish
            </Button>
          )}
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#52716c]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#177e73]" />
            Inspect your fish before sharing any buyer-held delivery PIN.
          </p>
        </aside>
      </div>
    </main>
  );
}
