import type { CatalogItem } from "@/components/ProductCard";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { product: CatalogItem; quantity: number; zone: string; purpose: "home_meal" | "office_lunch" | "weekend_gathering" | "party" | "community" | "freezer" | "home_operator" | "other" };
type CartContextValue = { line: CartLine | null; add: (line: CartLine) => { replaced: boolean }; updateQuantity: (quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "pondbasket-single-farmer-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [line, setLine] = useState<CartLine | null>(() => { try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) as CartLine : null; } catch { return null; } });
  useEffect(() => { try { if (line) localStorage.setItem(storageKey, JSON.stringify(line)); else localStorage.removeItem(storageKey); } catch { /* Cart remains usable when storage is unavailable. */ } }, [line]);
  const value = useMemo<CartContextValue>(() => ({ line, add: next => { const replaced = Boolean(line && line.product.farmerId !== next.product.farmerId); setLine(next); return { replaced }; }, updateQuantity: quantity => setLine(current => current ? { ...current, quantity } : null), clear: () => setLine(null) }), [line]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used within CartProvider"); return context; }
