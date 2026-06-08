"use client";

/**
 * CartContext — guest-friendly cart backed by localStorage.
 *
 * Performance / low-resource notes:
 *  - 100% client-side & offline-first: zero Firestore reads/writes for cart
 *    operations, which keeps Vercel function + Firebase quota usage at zero for
 *    the most frequent interaction on the site.
 *  - State hydrates synchronously from localStorage (no flash of empty cart).
 *  - Writes to localStorage are the only side effect; everything else is pure
 *    in-memory work, so it stays smooth on low-end devices.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import type { CartItem, Product } from "@/types";

const STORAGE_KEY = "starboy_cart";

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStored(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function priceOf(product: Product): number {
  return product.offerPrice ?? product.originalPrice ?? 0;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStored);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / private mode */
    }
  }, [items]);

  // Keep cart in sync across tabs without polling.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity: number = 1, size?: string, color?: string) => {
      if (!product?.id) return;
      const qty = Math.max(1, quantity);
      setItems((prev) => {
        const idx = prev.findIndex(
          (it) =>
            it.product.id === product.id &&
            it.size === size &&
            it.color === color
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }
        return [...prev, { product, quantity: qty, size, color }];
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string, size?: string, color?: string) => {
    setItems((prev) => prev.filter((it) => !(it.product.id === productId && it.size === size && it.color === color)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string, color?: string) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((it) => !(it.product.id === productId && it.size === size && it.color === color));
      return prev.map((it) =>
        (it.product.id === productId && it.size === size && it.color === color) ? { ...it, quantity } : it
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, it) => sum + priceOf(it.product) * it.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a <CartProvider>.");
  return ctx;
}
