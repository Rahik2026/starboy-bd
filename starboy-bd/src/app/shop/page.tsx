"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product, Category } from "@/types";

export default function ShopPage() {
  const params = useSearchParams();
  const categorySlug = params.get("category");
  const filter = params.get("filter");
  const sort = params.get("sort");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").order("createdAt", { ascending: false }),
        supabase.from("categories").select("*").order("priority"),
      ]);
      if (p.data) setProducts(p.data);
      if (c.data) setCategories(c.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) {
        list = list.filter((p) => p.categories?.includes(cat.id));
      }
    }

    if (filter === "sale") list = list.filter((p) => p.offerPrice && p.offerPrice < p.originalPrice);
    else if (filter === "trending") list = list.filter((p) => p.trending);
    else if (filter === "bestseller") list = list.filter((p) => p.bestSeller);

    if (sort === "new") list = [...list].reverse();
    else if (sort === "price_low") list.sort((a, b) => (a.offerPrice ?? a.originalPrice) - (b.offerPrice ?? b.originalPrice));
    else if (sort === "price_high") list.sort((a, b) => (b.offerPrice ?? b.originalPrice) - (a.offerPrice ?? a.originalPrice));

    list = list.filter((p) => {
      const price = p.offerPrice ?? p.originalPrice;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    return list;
  }, [products, categories, categorySlug, filter, sort, priceRange]);

  const title = categorySlug ? categories.find((c) => c.slug === categorySlug)?.name || "Shop" : filter === "sale" ? "Sale" : filter === "trending" ? "Trending" : filter === "bestseller" ? "Best Sellers" : sort === "new" ? "New Arrivals" : "All Products";

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="font-display text-2xl md:text-4xl font-bold text-ink-950 mb-2">{title}</h1>
          <p className="text-ink-500 text-sm md:text-base">{filtered.length} products available</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Categories</h3>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <a key={cat.id} href={`/shop?category=${cat.slug}`} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${categorySlug === cat.slug ? "bg-brand-50 text-brand-800 font-medium" : "text-ink-600 hover:bg-ink-50"}`}>{cat.name}</a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Price Range</h3>
              <div className="px-1">
                <input type="range" min={0} max={10000} step={100} value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} className="w-full accent-brand-700" />
                <div className="flex justify-between text-xs text-ink-500 mt-2"><span>৳0</span><span>৳{priceRange[1].toLocaleString()}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Filters</h3>
              <div className="space-y-1.5">
                {[{ label: "New Arrivals", href: "/shop?sort=new" }, { label: "Trending", href: "/shop?filter=trending" }, { label: "Best Sellers", href: "/shop?filter=bestseller" }, { label: "On Sale", href: "/shop?filter=sale" }].map((f) => (
                  <a key={f.label} href={f.href} className="block px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 transition-colors">{f.label}</a>
                ))}
              </div>
            </div>
          </aside>
          <div className="lg:hidden flex items-center justify-between mb-2">
            <button onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-800"><SlidersHorizontal className="w-4 h-4" /> Filters</button>
            <span className="text-xs text-ink-500">{filtered.length} items</span>
          </div>
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileFilterOpen(false)}>
              <div onClick={(e) => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg font-bold">Filters</h3><button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5" /></button></div>
                <div className="space-y-4">
                  <div><h4 className="text-sm font-semibold mb-2">Categories</h4><div className="flex flex-wrap gap-2">{categories.map((cat) => (<a key={cat.id} href={`/shop?category=${cat.slug}`} className="px-3 py-1.5 bg-ink-50 rounded-full text-xs text-ink-700">{cat.name}</a>))}</div></div>
                  <div><h4 className="text-sm font-semibold mb-2">Price Max: ৳{priceRange[1]}</h4><input type="range" min={0} max={10000} step={100} value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} className="w-full accent-brand-700" /></div>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filtered.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}
            </div>
            {filtered.length === 0 && <div className="text-center py-20"><p className="text-ink-500 text-sm">No products found.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
