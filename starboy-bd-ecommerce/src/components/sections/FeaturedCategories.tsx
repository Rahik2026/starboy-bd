"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { firebaseData } from "@/lib/firebaseData";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    firebaseData.from("categories").select("*").eq("featured", true).order("priority").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">Featured Categories</h2>
          <p className="text-ink-500 text-sm md:text-base max-w-xl mx-auto">Curated collections designed for every aspect of the modern lifestyle.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {categories.map((cat, i) => (
            <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="group block animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-ink-100">
                <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" loading={i < 2 ? "eager" : "lazy"} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <h3 className="text-white font-display text-lg md:text-xl font-semibold mb-0.5">{cat.name}</h3>
                  <p className="text-white/70 text-xs md:text-sm line-clamp-1">{cat.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
