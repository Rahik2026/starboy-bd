"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, calculateDiscount, truncate } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.originalPrice, product.offerPrice);

  const handleWishlist = () => {
    if (!user) {
      toast.error("Please login to save to wishlist");
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    toast.success("Added to cart");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-ink-50 rounded-2xl overflow-hidden mb-3">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {discount}% OFF
            </div>
          )}

          {product.trending && (
            <div className="absolute top-3 right-3 bg-ink-950/80 backdrop-blur text-brand-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Trending
            </div>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-ink-900 text-xs font-semibold py-2.5 rounded-xl shadow-soft hover:bg-brand-700 hover:text-white transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWishlist();
                }}
                className={`p-2.5 rounded-xl shadow-soft transition-colors ${
                  inWishlist ? "bg-red-500 text-white" : "bg-white text-ink-700 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-ink-500 line-clamp-1">{truncate(product.shortDescription, 45)}</p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm font-bold text-ink-900">
              {formatPrice(product.offerPrice ?? product.originalPrice)}
            </span>
            {product.offerPrice && (
              <span className="text-xs text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
