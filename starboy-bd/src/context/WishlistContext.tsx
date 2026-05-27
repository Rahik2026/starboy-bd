"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, WishlistItem } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const { data } = await supabase.from("wishlists").select("*,product:products(*)").eq("userId", user.id);
        if (data) setItems(data.map((row: any) => ({ product: row.product as Product, addedAt: row.createdAt })));
      } else {
        const stored = localStorage.getItem("sb_wishlist");
        if (stored) setItems(JSON.parse(stored));
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem("sb_wishlist", JSON.stringify(items));
  }, [items, user]);

  const addToWishlist = async (product: Product) => {
    if (!user) { toast.error("Login to save wishlist"); return; }
    if (items.find((i) => i.product.id === product.id)) return;
    await supabase.from("wishlists").insert({ userId: user.id, productId: product.id });
    setItems((prev) => [...prev, { product, addedAt: new Date().toISOString() }]);
    toast.success("Saved to wishlist");
  };

  const removeFromWishlist = async (productId: string) => {
    if (user) {
      await supabase.from("wishlists").delete().eq("userId", user.id).eq("productId", productId);
    }
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const isInWishlist = (productId: string) => items.some((i) => i.product.id === productId);
  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, totalItems }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
