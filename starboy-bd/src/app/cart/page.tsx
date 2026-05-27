"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-8">
          Shopping Cart ({totalItems})
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <ShoppingBag className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-ink-800 mb-1">Your cart is empty</h2>
            <p className="text-sm text-ink-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 bg-white rounded-2xl p-4 border border-ink-100 shadow-soft"
                  >
                    <Link href={`/product/${item.product.slug}`} className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-ink-50 flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${item.product.slug}`} className="font-semibold text-ink-900 text-sm md:text-base hover:text-brand-700 transition-colors">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-ink-500 mt-0.5">{item.product.shortDescription}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-ink-200 rounded-lg px-1.5 py-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-ink-100 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-ink-100 rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-ink-900">
                            {formatPrice((item.product.offerPrice ?? item.product.originalPrice) * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-soft sticky top-24">
                <h3 className="font-display text-lg font-bold text-ink-950 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Shipping</span>
                    <span>{totalPrice >= 5000 ? "Free" : formatPrice(120)}</span>
                  </div>
                  <div className="border-t border-ink-100 pt-3 flex justify-between font-bold text-ink-900 text-base">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice >= 5000 ? totalPrice : totalPrice + 120)}</span>
                  </div>
                </div>
                <button className="w-full mt-6 py-3.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors shadow-glow">
                  Checkout
                </button>
                <p className="text-center text-[11px] text-ink-400 mt-3">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
