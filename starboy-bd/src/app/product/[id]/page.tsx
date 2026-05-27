"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Share2, MessageCircle, Truck, ShieldCheck, RefreshCcw, ChevronLeft, Star, Minus, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ui/ProductCard";
import toast from "react-hot-toast";
import { Product, Review } from "@/types";

export default function ProductPage() {
  const params = useParams();
  const slug = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: p } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (p) {
        setProduct(p);
        const { data: r } = await supabase.from("reviews").select("*").eq("productId", p.id);
        setReviews(r || []);
        const { data: rel } = await supabase.from("products").select("*").neq("slug", slug).limit(4);
        setRelated(rel || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Product Not Found</h1>
          <Link href="/shop" className="text-brand-700 text-sm hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.originalPrice, product.offerPrice);

  const handleAddToCart = () => { for (let i = 0; i < quantity; i++) addToCart(product); toast.success(`Added ${quantity} to cart`); };
  const handleWishlist = () => {
    if (!user) { toast.error("Please login to use wishlist"); return; }
    if (inWishlist) { removeFromWishlist(product.id); toast.success("Removed from wishlist"); }
    else { addToWishlist(product); toast.success("Saved to wishlist"); }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-6"><ChevronLeft className="w-4 h-4" /> Back to Shop</Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="relative aspect-[4/5] bg-ink-50 rounded-2xl overflow-hidden mb-4">
              <Image src={product.images?.[selectedImage] || ""} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              {discount > 0 && <div className="absolute top-4 left-4 bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">{discount}% OFF</div>}
            </div>
            <div className="flex gap-3 overflow-auto no-scrollbar">
              {(product.images || []).map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === i ? "border-brand-600" : "border-transparent"}`}>
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-1"><span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{(product.categories || []).join(" / ").toUpperCase()}</span></div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl md:text-2xl font-bold text-ink-900">{formatPrice(product.offerPrice ?? product.originalPrice)}</span>
              {product.offerPrice && <span className="text-base text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>}
              {discount > 0 && <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">Save {formatPrice(product.originalPrice - (product.offerPrice ?? 0))}</span>}
            </div>
            <p className="text-ink-600 text-sm md:text-base leading-relaxed mb-6">{product.shortDescription}</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 border border-ink-200 rounded-xl px-2 py-1.5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 hover:bg-ink-100 rounded-lg"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-1.5 hover:bg-ink-100 rounded-lg"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white text-sm font-semibold py-3 rounded-xl transition-colors"><ShoppingBag className="w-4 h-4" /> Add to Cart</button>
              <button onClick={handleWishlist} className={`p-3 rounded-xl border transition-colors ${inWishlist ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-ink-200 text-ink-600 hover:border-red-200 hover:text-red-600"}`}><Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} /></button>
              <button className="p-3 rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors"><Share2 className="w-5 h-5" /></button>
            </div>
            {user && <Link href={`/dashboard?tab=messages&product=${product.id}`} className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 font-medium mb-6"><MessageCircle className="w-4 h-4" /> Message seller about this product</Link>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[{ icon: Truck, text: "Free Delivery over ৳5,000" }, { icon: ShieldCheck, text: "100% Authentic" }, { icon: RefreshCcw, text: "7-Day Returns" }].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-xs text-ink-600 bg-white border border-ink-100 rounded-xl px-3 py-2.5"><item.icon className="w-4 h-4 text-brand-600" /> {item.text}</div>
              ))}
            </div>
            <div className="border-b border-ink-200 mb-4">
              <div className="flex gap-6">
                {(["details", "reviews"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-semibold capitalize transition-colors relative ${activeTab === tab ? "text-brand-700" : "text-ink-400 hover:text-ink-600"}`}>
                    {tab}
                    {activeTab === tab && <motion.div layoutId="product-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              {activeTab === "details" ? (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-sm text-ink-700 leading-relaxed space-y-4">
                  <p>{product.fullDescription}</p>
                  {product.specs && <div className="grid grid-cols-2 gap-3 mt-4">{Object.entries(product.specs as Record<string, string>).map(([k, v]) => (<div key={k} className="bg-white border border-ink-100 rounded-xl px-4 py-3"><div className="text-[11px] text-ink-400 uppercase tracking-wider mb-0.5">{k}</div><div className="font-medium text-ink-900">{v}</div></div>))}</div>}</div>
              ) : (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {reviews.length === 0 ? <p className="text-sm text-ink-500">No reviews yet. Be the first!</p> : reviews.map((r) => (
                    <div key={r.id} className="bg-white border border-ink-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs font-bold">{r.userName?.charAt(0)}</div>
                        <div>
                          <div className="text-sm font-semibold text-ink-900">{r.userName}</div>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => (<Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-brand-500 fill-brand-500" : "text-ink-200"}`} />))}</div>
                        </div>
                      </div>
                      <p className="text-sm text-ink-700">{r.comment}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {related.length > 0 && (
          <div className="mt-16 md:mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink-950 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{related.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}</div>
          </div>
        )}
      </div>
    </div>
  );
}
