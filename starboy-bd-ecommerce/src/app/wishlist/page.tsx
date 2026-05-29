"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, removeFromWishlist, totalItems } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success("Added to cart");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-ink-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-ink-800 mb-1">Login to view your wishlist</h2>
          <p className="text-sm text-ink-500 mb-6">Save your favorite items for later.</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">Login / Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-8">My Wishlist ({totalItems})</h1>
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <Heart className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-ink-800 mb-1">Your wishlist is empty</h2>
            <p className="text-sm text-ink-500 mb-6">Start saving items you love.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">Browse Shop <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence>
              {items.map((item, i) => {
                const product = item.product;
                const discount = calculateDiscount(product.originalPrice, product.offerPrice);
                const isOutOfStock = product.availability === "out_of_stock" || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
                return (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="group relative">
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-[3/4] bg-ink-50 rounded-2xl overflow-hidden mb-3">
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                        {discount > 0 && <div className="absolute top-3 left-3 bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">{discount}% OFF</div>}
                        {isOutOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-ink-950 text-white text-xs font-bold px-4 py-2 rounded-full">Out of Stock</span></div>}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-ink-900">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink-900">{formatPrice(product.offerPrice ?? product.originalPrice)}</span>
                          {product.offerPrice && <span className="text-xs text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleAddToCart(product)} disabled={isOutOfStock} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-colors ${isOutOfStock ? 'bg-ink-300 text-white cursor-not-allowed' : 'bg-ink-950 text-brand-300 hover:bg-brand-700 hover:text-white'}`}>
                        <ShoppingBag className="w-3.5 h-3.5" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                      </button>
                      <button onClick={() => { removeFromWishlist(product.id); toast.success("Removed from wishlist"); }} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
