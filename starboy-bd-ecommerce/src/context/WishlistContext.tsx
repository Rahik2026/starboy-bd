"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, WishlistItem } from "@/types";
import { firebaseData } from "@/lib/firebaseData";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const { data } = await firebaseData
          .from("wishlists")
          .select("*,product:products(*)")
          .eq("userId", user.id);
        if (data) {
          const mapped = data.map((row: any) => ({
            product: row.product as Product,
            addedAt: row.createdAt,
          }));
          setItems(mapped);
        }
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

  const refreshWishlist = async () => {
    if (!user) return;
    const { data } = await firebaseData
      .from("wishlists")
      .select("*,product:products(*)")
      .eq("userId", user.id);
    if (data) {
      const mapped = data.map((row: any) => ({
        product: row.product as Product,
        addedAt: row.createdAt,
      }));
      setItems(mapped);
    }
  };

  const addToWishlist = async (product: Product) => {
    if (!user) {
      toast.error("Login to save wishlist");
      return;
    }
    if (items.find((i) => i.product.id === product.id)) return;
    await firebaseData
      .from("wishlists")
      .insert({ userId: user.id, productId: product.id });
    await refreshWishlist();
    toast.success("Saved to wishlist");
  };

  const removeFromWishlist = async (productId: string) => {
    if (user) {
      await firebaseData
        .from("wishlists")
        .delete()
        .eq("userId", user.id)
        .eq("productId", productId);
      await refreshWishlist();
    } else {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    }
  };

  const isInWishlist = (productId: string) =>
    items.some((i) => i.product.id === productId);
  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, isInWishlist, totalItems }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
