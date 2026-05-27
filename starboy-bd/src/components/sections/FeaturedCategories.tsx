"use client";

import { useState, useEffect } from "react";
import CategoryCard from "@/components/ui/CategoryCard";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").eq("featured", true).order("priority").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">Featured Categories</h2>
          <p className="text-ink-500 text-sm md:text-base max-w-xl mx-auto">Curated collections designed for every aspect of the modern lifestyle.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {categories.map((cat, i) => (<CategoryCard key={cat.id} category={cat} index={i} />))}
        </div>
      </div>
    </section>
  );
}
