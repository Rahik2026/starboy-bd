"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").eq("trending", true).order("createdAt", { ascending: false }).limit(4).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Trending Now</span>
        </div>
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-2">Most Popular This Week</h2>
            <p className="text-ink-500 text-sm md:text-base">What our customers are loving right now.</p>
          </div>
          <Link href="/shop?filter=trending" className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors">View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}
        </div>
      </div>
    </section>
  );
}
