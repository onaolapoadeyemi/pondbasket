import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FishSymbol,
  MapPin,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { ProductCard } from "@/components/ProductCard";
import {
  ListingGridSkeleton,
  RequestError,
  RequestRefreshNotice,
} from "@/components/RequestFeedback";
import { Button } from "@/components/ui/button";

const zones = ["Ajah", "Lekki Phase 1", "Chevron"];
export default function Home() {
  const [zone, setZone] = useState("Ajah");
  const input = useMemo(() => ({ zone }), [zone]);
  const { data, isLoading, isFetching, error, refetch } =
    trpc.catalog.list.useQuery(input);
  return (
    <main>
      <section className="relative overflow-hidden bg-[#092b2a] pb-16 pt-12 text-white sm:pb-24 sm:pt-20">
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full border-[55px] border-[#177e73]/55" />
        <div className="absolute -left-12 bottom-0 h-40 w-80 rounded-full bg-[#d6e46b]/10 blur-3xl" />
        <div className="container relative grid items-end gap-12 lg:grid-cols-[1.12fr_.88fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d6e46b]/25 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#d6e46b]">
              <Sprout className="h-3.5 w-3.5" />
              Local farm to table · Lagos pilot
            </div>
            <h1 className="font-display max-w-3xl text-[3.15rem] font-bold leading-[.94] tracking-[-0.075em] sm:text-7xl">
              Fresh fish, from a farm you can trust.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#d4e5df] sm:text-lg">
              Shop fresh catfish and tilapia from verified farms near you.
              Choose your size and processing, then arrange pickup or delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop">
                <Button
                  size="lg"
                  className="w-full rounded-full bg-[#d6e46b] px-6 text-[#092b2a] shadow-none hover:bg-[#ebf3a6] sm:w-auto"
                >
                  Find fresh fish <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/farm">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Sell fish on {BRAND.name}
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#c2d9d2]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#d6e46b]" />
                Verified local farms
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#d6e46b]" />
                Inspect before PIN release
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md rounded-[30px] border border-white/15 bg-[#0b4f4a]/80 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[22px] bg-[#f6f4ec] p-5 text-[#092b2a]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#60827d]">
                  Today’s harvest
                </p>
                <FishSymbol className="h-5 w-5 text-[#177e73]" />
              </div>
              <div className="mt-8 rounded-2xl bg-[#d6e46b] p-5">
                <p className="font-display text-4xl font-bold tracking-[-.06em]">
                  48 kg
                </p>
                <p className="mt-1 text-sm font-medium text-[#335e59]">
                  fresh catfish available in Ajah
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#092b2a]/10 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b8883]">
                    From
                  </p>
                  <p className="mt-1 font-display text-lg font-bold">
                    ₦4,200
                    <span className="text-xs font-sans font-normal">/kg</span>
                  </p>
                </div>
                <div className="rounded-xl border border-[#092b2a]/10 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b8883]">
                    Fulfillment
                  </p>
                  <p className="mt-1 text-sm font-bold">Pickup or delivery</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white p-3 text-[#092b2a] shadow-xl">
              <p className="flex items-center gap-1.5 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-[#177e73]" />
                Protected payment
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="container -mt-1 py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
              Shop by your zone
            </p>
            <h2 className="font-display mt-2 text-4xl font-bold tracking-[-.06em] text-[#092b2a]">
              What’s fresh near you?
            </h2>
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#177e73]" />
            <select
              value={zone}
              onChange={event => setZone(event.target.value)}
              className="h-11 appearance-none rounded-full border border-[#092b2a]/15 bg-white py-2 pl-9 pr-9 text-sm font-bold text-[#092b2a] outline-none"
            >
              <option value="">Choose a zone</option>
              {zones.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52716c]" />
          </div>
        </div>
        {isFetching && !isLoading ? (
          <div className="mt-5">
            <RequestRefreshNotice label="Refreshing this zone…" />
          </div>
        ) : null}
        <div className="mt-8">
          {error ? (
            <RequestError
              title="Fresh fish could not be loaded."
              detail={error.message}
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : isLoading ? (
            <ListingGridSkeleton count={3} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.slice(0, 3).map(item => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0b4f4a] underline decoration-[#d6e46b] decoration-4 underline-offset-4"
          >
            View every available listing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section className="container py-8 sm:py-14">
        <div className="grid overflow-hidden rounded-[30px] bg-[#e8e7dc] lg:grid-cols-[.85fr_1.15fr]">
          <div className="bg-[#d6e46b] p-8 sm:p-12">
            <ShoppingBasket className="h-8 w-8 text-[#0b4f4a]" />
            <h2 className="font-display mt-8 text-4xl font-bold leading-none tracking-[-.06em]">
              Clear choices. No surprises.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#335e59]">
              See species, fish form, size, processing, minimum order,
              availability, delivery choices, and every fee before payment.
            </p>
          </div>
          <div className="grid gap-8 p-8 sm:grid-cols-3 sm:p-12">
            {[
              [
                "1",
                "Confirm your zone",
                "Availability reflects the configured pilot area.",
              ],
              [
                "2",
                "Choose your fish",
                "Pick catfish or tilapia, size, processing, and quantity.",
              ],
              [
                "3",
                "Inspect before acceptance",
                "Share the buyer-held delivery PIN only after inspection.",
              ],
            ].map(([number, title, detail]) => (
              <div key={number}>
                <span className="font-display text-4xl font-bold text-[#177e73]">
                  {number}
                </span>
                <h3 className="mt-5 text-sm font-bold text-[#092b2a]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#52716c]">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
