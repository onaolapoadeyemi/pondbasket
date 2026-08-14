import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CircleAlert, Heart, ShoppingBasket } from "lucide-react";
import { Link } from "wouter";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const favorites = trpc.customer.favorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  if (!isAuthenticated)
    return (
      <main className="container py-14">
        <section className="mx-auto max-w-xl rounded-[30px] border border-[#092b2a]/10 bg-white p-9 text-center shadow-[0_12px_30px_rgba(9,43,42,.06)]">
          <Heart className="mx-auto h-9 w-9 text-[#177e73]" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
            Save fish for later
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-[-.06em]">
            Keep your shortlist close.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#52716c]">
            Sign in to save catfish and tilapia listings, then return when you
            are ready to compare or order.
          </p>
          <Button
            onClick={startLogin}
            className="mt-7 rounded-full bg-[#0b4f4a] px-6"
          >
            Sign in to save fish
          </Button>
        </section>
      </main>
    );
  if (favorites.isLoading)
    return (
      <main className="container py-12">
        <div className="h-64 animate-pulse rounded-[30px] bg-[#e8e7dc]" />
      </main>
    );
  if (favorites.error)
    return (
      <main className="container py-12">
        <div className="rounded-[24px] border border-[#c85665]/20 bg-white p-7">
          <CircleAlert className="h-6 w-6 text-[#b84458]" />
          <h1 className="font-display mt-3 text-3xl font-bold">
            Saved fish could not be loaded.
          </h1>
          <Button
            onClick={() => favorites.refetch()}
            className="mt-5 rounded-full bg-[#0b4f4a]"
          >
            Try again
          </Button>
        </div>
      </main>
    );
  const items = favorites.data?.items ?? [];
  return (
    <main className="container py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">
            Customer space
          </p>
          <h1 className="font-display mt-2 text-5xl font-bold tracking-[-.07em]">
            Saved fish
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#52716c]">
            A private shortlist of listings you may want to revisit.
            Availability and prices remain live.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-[#0b4f4a] px-5 py-3 text-sm font-bold text-white"
        >
          <ShoppingBasket className="h-4 w-4" />
          Continue shopping
        </Link>
      </div>
      {items.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <section className="mt-8 rounded-[28px] border border-dashed border-[#092b2a]/20 bg-white p-10 text-center">
          <Heart className="mx-auto h-9 w-9 text-[#177e73]" />
          <h2 className="font-display mt-4 text-3xl font-bold">
            Nothing saved yet.
          </h2>
          <p className="mt-3 text-sm text-[#52716c]">
            Tap the heart on any eligible listing to keep it here for later.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-[#d6e46b] px-5 py-3 text-sm font-bold text-[#092b2a]"
          >
            Browse fresh fish
          </Link>
        </section>
      )}
    </main>
  );
}
