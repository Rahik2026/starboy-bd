"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-8">
          My Wishlist
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <Heart className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-ink-800 mb-1">Your wishlist is empty</h2>
            <p className="text-sm text-ink-500 mb-6">Save items you love to buy later.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors"
            >
              Explore Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-soft group"
              >
                <Link href={`/product/${item.product.slug}`} className="block relative aspect-[3/4] bg-ink-50">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="p-3 md:p-4">
                  <Link href={`/product/${item.product.slug}`} className="block">
                    <h3 className="text-sm font-semibold text-ink-900 hover:text-brand-700 transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <span className="text-sm font-bold text-ink-900">
                      {formatPrice(item.product.offerPrice ?? item.product.originalPrice)}
                    </span>
                    {item.product.offerPrice && (
                      <span className="text-xs text-ink-400 line-through">
                        {formatPrice(item.product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addToCart(item.product);
                        toast.success("Moved to cart");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        removeFromWishlist(item.product.id);
                        toast.success("Removed");
                      }}
                      className="p-2.5 border border-ink-200 rounded-xl text-ink-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
