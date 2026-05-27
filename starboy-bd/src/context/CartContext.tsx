"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase if logged in, else localStorage
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (user) {
        const { data } = await supabase.from("carts").select("*,product:products(*)").eq("userId", user.id);
        if (data) {
          const mapped = data.map((row: any) => ({ product: row.product as Product, quantity: row.quantity }));
          setItems(mapped);
        }
      } else {
        const stored = localStorage.getItem("sb_cart");
        if (stored) setItems(JSON.parse(stored));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem("sb_cart", JSON.stringify(items));
  }, [items, user]);

  const addToCart = async (product: Product, quantity = 1) => {
    if (user) {
      const { error } = await supabase.from("carts").upsert({ userId: user.id, productId: product.id, quantity }, { onConflict: "userId,productId" });
      if (error) toast.error(error.message);
      else toast.success("Added to cart");
      // Refresh
      const { data } = await supabase.from("carts").select("*,product:products(*)").eq("userId", user.id);
      if (data) setItems(data.map((row: any) => ({ product: row.product, quantity: row.quantity })));
    } else {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i));
        }
        return [...prev, { product, quantity }];
      });
      toast.success("Added to cart");
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await supabase.from("carts").delete().eq("userId", user.id).eq("productId", productId);
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    if (user) {
      await supabase.from("carts").update({ quantity }).eq("userId", user.id).eq("productId", productId);
      setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    } else {
      setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    }
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from("carts").delete().eq("userId", user.id);
    }
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + (i.product.offerPrice ?? i.product.originalPrice) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
