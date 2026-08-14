import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  ClipboardList,
  Heart,
  House,
  Menu,
  ShoppingBasket,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BRAND } from "@shared/brand";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { FavoriteButton } from "./FavoriteButton";

const nav = [
  { href: "/shop", label: "Shop fish" },
  { href: "/orders", label: "My orders" },
  { href: "/notifications", label: "Notifications" },
  { href: "/addresses", label: "Saved addresses" },
  { href: "/profile", label: "Profile" },
  { href: "/legal", label: "Help" },
];

export function PondShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { line } = useCart();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const detailProductId = /^\/shop\/(\d+)$/.exec(location)?.[1];
  return (
    <div className="min-h-screen bg-[#f6f4ec] text-[#092b2a]">
      <div className="border-b border-[#092b2a]/10 bg-[#d6e46b] px-4 py-2 text-center text-xs font-semibold tracking-[0.12em] text-[#092b2a] sm:text-sm">
        <span className="mr-2 inline-block rounded-full bg-[#092b2a] px-2 py-0.5 text-[10px] tracking-[0.12em] text-white">
          DEMO MODE
        </span>
        Fictional listings, mock payments, and simulated notifications only.
      </div>
      <header className="sticky top-0 z-40 border-b border-[#092b2a]/10 bg-[#f6f4ec]/95 backdrop-blur-xl">
        <div className="container flex h-[74px] items-center justify-between gap-5">
          <Link href="/">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#335e59] lg:flex">
            {nav.slice(0, 3).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  location === item.href
                    ? "text-[#0b4f4a]"
                    : "transition-colors hover:text-[#0b4f4a]"
                }
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/favorites"
                className="inline-flex items-center gap-1 transition-colors hover:text-[#0b4f4a]"
              >
                <Heart className="h-4 w-4" />
                Saved
              </Link>
            )}
            <Link
              href="/cart"
              className="inline-flex items-center gap-1 transition-colors hover:text-[#0b4f4a]"
            >
              <ShoppingBasket className="h-4 w-4" />
              Basket{line ? " · 1" : ""}
            </Link>
            {user?.role === "farmer" && (
              <Link
                href="/farm"
                className="transition-colors hover:text-[#0b4f4a]"
              >
                Farmer portal
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="transition-colors hover:text-[#0b4f4a]"
              >
                Operations
              </Link>
            )}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            {detailProductId && (
              <FavoriteButton productId={Number(detailProductId)} />
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e7dc] text-[#0b4f4a] transition-transform active:scale-95"
                  aria-label="Profile"
                >
                  <UserRound className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-[#335e59] hover:bg-[#e8e7dc]"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={startLogin}
                  className="text-[#335e59] hover:bg-[#e8e7dc]"
                >
                  Sign in
                </Button>
                <Button
                  onClick={startLogin}
                  className="rounded-full bg-[#0b4f4a] px-5 text-white shadow-none hover:bg-[#092b2a]"
                >
                  Create account
                </Button>
              </>
            )}
          </div>
          {detailProductId && (
            <div className="sm:hidden">
              <FavoriteButton productId={Number(detailProductId)} compact />
            </div>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-[#e8e7dc] lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Open navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-[#092b2a]/10 bg-[#f6f4ec] px-5 py-4 lg:hidden">
            <div className="grid gap-1">
              {nav.map(item => (
                <Link
                  onClick={() => setOpen(false)}
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[#e8e7dc]"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  onClick={() => setOpen(false)}
                  href="/favorites"
                  className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[#e8e7dc]"
                >
                  Saved fish
                </Link>
              )}
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#c85535]"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={startLogin}
                  className="rounded-xl bg-[#0b4f4a] px-3 py-3 text-left text-sm font-semibold text-white"
                >
                  Create an account
                </button>
              )}
            </div>
          </nav>
        )}
      </header>
      {children}
      <footer className="mt-16 border-t border-[#092b2a]/10 bg-[#092b2a] text-[#f6f4ec]">
        <div className="container grid gap-8 py-10 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <BrandMark compact />
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#d7e2db]">
              Fresh catfish and tilapia from verified local farms, for your home
              table, office kitchen, or next gathering.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6e46b]">
              PondBasket
            </p>
            <div className="mt-4 grid gap-2 text-sm text-[#d7e2db]">
              <Link href="/shop">Shop fish</Link>
              <Link href="/farm">Sell fish</Link>
              <Link href="/legal">Help & policies</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6e46b]">
              Pilot service area
            </p>
            <p className="mt-4 text-sm leading-6 text-[#d7e2db]">
              {BRAND.activeServiceLocation}
              <br />
              Local pickup and configured delivery zones only.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-[#adc5bd]">
          © {new Date().getFullYear()} {BRAND.name} Demo. {BRAND.legalStatus}
        </div>
      </footer>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#092b2a]/10 bg-[#f6f4ec] px-2 py-2 shadow-[0_-8px_28px_rgba(9,43,42,.08)] sm:hidden">
        {[
          { href: "/", icon: House, label: "Home" },
          { href: "/shop", icon: Store, label: "Shop" },
          {
            href: "/cart",
            icon: ShoppingBasket,
            label: line ? "Basket · 1" : "Basket",
          },
          { href: "/orders", icon: ClipboardList, label: "Orders" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`grid place-items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${location === href ? "bg-[#d6e46b] text-[#092b2a]" : "text-[#50736e]"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
