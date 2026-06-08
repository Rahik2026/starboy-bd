"use client";

import { Suspense } from "react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import { firebaseData } from "@/lib/firebaseData";
import { Product } from "@/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Bounded fetch — search filters this set client-side. Caps read cost.
      const { data } = await firebaseData.from("products").select("*").order("createdAt", { ascending: false }).limit(250);
      if (data) setProducts(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.shortDescription || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (p.fullDescription || "").toLowerCase().includes(q) ||
      (p.categoryNames || []).some((c) => c.toLowerCase().includes(q))
    );
  }, [products, query]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-2">Search: &quot;{query}&quot;</h1>
        <p className="text-ink-500 text-sm mb-8">{filtered.length} results found</p>
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <p className="text-ink-500 text-sm">No products match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
