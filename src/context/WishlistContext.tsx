"use client";

/**
 * WishlistContext — localStorage-backed wishlist.
 *
 * Performance / low-resource notes:
 *  - Like the cart, this is fully client-side and offline-first: no Firestore
 *    reads/writes, so wishlist toggles never touch Vercel or Firebase quota.
 *  - Synchronous hydration from localStorage prevents UI flicker on mobile.
 *  - Stored per-user (and for guests) so the heart state survives reloads.
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
import type { WishlistItem, Product } from "@/types";

const STORAGE_KEY = "starboy_wishlist";

interface WishlistContextValue {
  items: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function readStored(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(readStored);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    if (!product?.id) return;
    setItems((prev) => {
      if (prev.some((it) => it.product.id === product.id)) return prev;
      return [...prev, { product, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((it) => it.product.id === productId),
    [items]
  );

  const clearWishlist = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.length, [items]);

  const value: WishlistContextValue = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    totalItems,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a <WishlistProvider>.");
  return ctx;
}
