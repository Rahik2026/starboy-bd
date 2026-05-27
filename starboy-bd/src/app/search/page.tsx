"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").order("createdAt", { ascending: false }).then(({ data }) => {
      if (data) setProducts(data);
      setLoading(false);
    });
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(term)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(term))
    );
  }, [q, products]);

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Search Results</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-2">&quot;{q}&quot;</h1>
        <p className="text-sm text-ink-500 mb-8">{results.length} product{results.length !== 1 ? "s" : ""} found</p>
        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {results.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <Search className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-800 font-medium mb-1">No products found</p>
            <p className="text-sm text-ink-500 mb-6">Try a different keyword or browse categories.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">Browse All <ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
