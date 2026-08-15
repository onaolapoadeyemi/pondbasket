import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { formatNgn } from "@/components/ProductCard";
import {
  RequestError,
  RequestRefreshNotice,
} from "@/components/RequestFeedback";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  CircleAlert,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { line, clear, updateQuantity } = useCart();
  const [created, setCreated] = useState<{
    orderId: number;
    publicCode: string;
  } | null>(null);
  const [paid, setPaid] = useState(false);
  const profile = trpc.customer.profile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const quoteInput = useMemo(
    () =>
      line
        ? {
            productId: line.product.id,
            quantity: line.quantity,
            zone: line.zone,
          }
        : undefined,
    [line]
  );
  const quote = trpc.catalog.quote.useQuery(quoteInput as any, {
    enabled: Boolean(quoteInput),
  });
  const addressId =
    selectedAddress ??
    profile.data?.addresses.find(address => address.serviceZone === line?.zone)
      ?.id ??
    profile.data?.addresses[0]?.id;
  const checkoutError = profile.error ?? quote.error;
  const isCheckoutLoading = profile.isLoading || quote.isLoading;
  const create = trpc.orders.create.useMutation({
    onSuccess: data => setCreated(data),
  });
  const mockPay = trpc.orders.mockPay.useMutation({
    onSuccess: () => {
      setPaid(true);
      clear();
    },
  });
  if (!line)
    return (
      <main className="container py-14">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#092b2a]/10 bg-white p-9 text-center">
          <ShoppingBasket className="mx-auto h-9 w-9 text-[#177e73]" />
          <h1 className="font-display mt-5 text-4xl font-bold tracking-[-.06em]">
            Your basket is ready when you are.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#52716c]">
            PondBasket permits one farm per order, which keeps harvest,
            fulfillment, and delivery communication clear.
          </p>
          <Link href="/shop">
            <Button className="mt-7 rounded-full bg-[#0b4f4a]">
              Browse fresh fish
            </Button>
          </Link>
        </div>
      </main>
    );
  if (!isAuthenticated)
    return (
      <main className="container py-14">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#092b2a]/10 bg-white p-9 text-center">
          <ShoppingBasket className="mx-auto h-9 w-9 text-[#177e73]" />
          <h1 className="font-display mt-5 text-4xl font-bold tracking-[-.06em]">
            Sign in to protect your reservation.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#52716c]">
            Your basket is saved locally. Sign in to select a private delivery
            address and create an immutable Demo Mode order snapshot.
          </p>
          <Button
            onClick={startLogin}
            className="mt-7 rounded-full bg-[#0b4f4a]"
          >
            Sign in to continue
          </Button>
        </div>
      </main>
    );
  return (
    <main className="container py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
          Single-farm basket
        </p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.07em]">
          Review your fish.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#52716c]">
          Each PondBasket checkout is kept to one verified farm so the farmer,
          condition, and delivery handoff are always traceable.
        </p>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[26px] border border-[#092b2a]/10 bg-white p-6">
          <div className="flex gap-4">
            {line.product.imageUrls?.[0] ? (
              <img
                src={line.product.imageUrls[0]}
                alt={`${line.product.species} from ${line.product.farmer}`}
                className="h-24 w-28 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-24 w-28 place-items-center rounded-2xl bg-[#0b4f4a] font-display text-lg font-bold capitalize text-white">
                {line.product.species}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-bold capitalize">
                {line.product.species} · {line.product.processing}
              </p>
              <p className="mt-1 text-sm text-[#52716c]">
                {line.product.farmer} · {line.zone}
              </p>
              <p className="mt-3 font-display text-xl font-bold">
                {formatNgn(line.product.unitPriceKobo)}{" "}
                <span className="font-sans text-sm font-normal text-[#52716c]">
                  / {line.product.unit}
                </span>
              </p>
            </div>
            <button
              onClick={clear}
              aria-label="Remove from cart"
              className="h-fit rounded-full bg-[#f9d8ce] p-2 text-[#9c3b24]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-[#092b2a]/8 pt-5">
            <span className="text-sm font-bold">Quantity</span>
            <input
              type="number"
              min={line.product.minOrder}
              max={line.product.availableQuantity}
              value={line.quantity}
              onChange={event =>
                updateQuantity(
                  Math.max(
                    line.product.minOrder,
                    Math.min(
                      line.product.availableQuantity,
                      Number(event.target.value)
                    )
                  )
                )
              }
              className="w-24 rounded-xl bg-[#f6f4ec] px-3 py-2 text-sm"
            />
            <span className="text-sm text-[#52716c]">
              {line.product.unit} · Minimum {line.product.minOrder}
            </span>
          </div>
          <p className="mt-5 rounded-xl bg-[#eff3db] p-3 text-xs leading-5 text-[#52716c]">
            Single-farmer boundary: adding a fish from a different farm replaces
            this basket after clear customer notice.
          </p>
        </section>
        <aside className="rounded-[26px] border border-[#092b2a]/10 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#177e73]">
            Checkout
          </p>
          {checkoutError ? (
            <RequestError
              className="mt-5"
              title="Checkout details could not be prepared."
              detail={checkoutError.message}
              onRetry={() => {
                profile.refetch();
                quote.refetch();
              }}
              isRetrying={profile.isFetching || quote.isFetching}
            />
          ) : isCheckoutLoading ? (
            <div className="mt-5 space-y-4" aria-busy="true">
              <RequestRefreshNotice label="Preparing your secure quote…" />
              <div className="h-28 animate-pulse rounded-2xl bg-[#e8e7dc]" />
            </div>
          ) : !addressId ? (
            <div className="mt-5 rounded-2xl bg-[#f9d8ce] p-4">
              <p className="text-sm font-bold text-[#9c3b24]">
                A private delivery address is needed.
              </p>
              <Link href="/addresses">
                <Button className="mt-3 rounded-full bg-[#0b4f4a]">
                  Add an address
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[#52716c]">
                Delivery address
                <select
                  value={addressId}
                  onChange={event =>
                    setSelectedAddress(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl bg-[#f6f4ec] px-3 py-3 text-sm font-normal normal-case"
                >
                  {profile.data?.addresses.map(address => (
                    <option key={address.id} value={address.id}>
                      {address.serviceZone} · {address.landmark}
                    </option>
                  ))}
                </select>
              </label>
              {quote.data && (
                <div className="mt-5 space-y-3 rounded-2xl bg-[#f6f4ec] p-4 text-sm">
                  <div className="flex justify-between text-[#52716c]">
                    <span>Fish subtotal</span>
                    <span>{formatNgn(quote.data.pricing.subtotalKobo)}</span>
                  </div>
                  <div className="flex justify-between text-[#52716c]">
                    <span>Delivery</span>
                    <span>
                      {formatNgn(quote.data.pricing.deliveryChargeKobo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#52716c]">
                    <span>Buyer service fee</span>
                    <span>
                      {formatNgn(quote.data.pricing.buyerServiceFeeKobo)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#092b2a]/10 pt-3 font-bold">
                    <span>Buyer total</span>
                    <span>{formatNgn(quote.data.pricing.buyerTotalKobo)}</span>
                  </div>
                </div>
              )}
              {quote.isFetching && !quote.isLoading ? (
                <div className="mt-4">
                  <RequestRefreshNotice label="Updating your quote…" />
                </div>
              ) : null}
              {!created ? (
                <Button
                  disabled={create.isPending || quote.isLoading}
                  onClick={() =>
                    create.mutate({
                      productId: line.product.id,
                      quantity: line.quantity,
                      addressId,
                      purpose: line.purpose,
                      idempotencyKey: crypto.randomUUID(),
                    })
                  }
                  className="mt-5 w-full rounded-full bg-[#0b4f4a]"
                >
                  Reserve & continue to Demo payment
                </Button>
              ) : paid ? (
                <div className="mt-5 rounded-2xl bg-[#dcefe9] p-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-[#177e73]" />
                  <p className="mt-2 text-sm font-bold">
                    Protected mock payment confirmed
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#52716c]">
                    Order {created.publicCode} is now with the farmer. Follow
                    its timeline in My orders.
                  </p>
                  <Link href="/orders">
                    <Button className="mt-4 rounded-full bg-[#0b4f4a]">
                      View my orders
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#eff3db] p-4">
                  <p className="text-sm font-bold">
                    Reservation {created.publicCode}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#52716c]">
                    Demo Mode uses a verified mock payment; no real money is
                    collected.
                  </p>
                  <Button
                    disabled={mockPay.isPending}
                    onClick={() => mockPay.mutate({ orderId: created.orderId })}
                    className="mt-4 w-full rounded-full bg-[#0b4f4a]"
                  >
                    Confirm mock payment
                  </Button>
                </div>
              )}
              {create.error && (
                <p className="mt-3 flex gap-2 text-xs leading-5 text-[#9c3b24]">
                  <CircleAlert className="h-4 w-4 shrink-0" />
                  {create.error.message}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
