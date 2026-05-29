"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import Hero from "@/components/sections/Hero";

const FeaturedCategories = lazy(() => import("@/components/sections/FeaturedCategories"));
const NewArrivals = lazy(() => import("@/components/sections/NewArrivals"));
const TrendingProducts = lazy(() => import("@/components/sections/TrendingProducts"));
const BestSellers = lazy(() => import("@/components/sections/BestSellers"));
const BrandExperience = lazy(() => import("@/components/sections/BrandExperience"));
const StatsSection = lazy(() => import("@/components/sections/StatsSection"));
const Testimonials = lazy(() => import("@/components/sections/Testimonials"));

function SectionSkeleton() {
  return (
    <div className="py-16 md:py-24 animate-pulse bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-8 bg-ink-100 rounded-lg w-64 mb-3" />
        <div className="h-4 bg-ink-100 rounded w-96 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-ink-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<SectionSkeleton />}><FeaturedCategories /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><NewArrivals /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><TrendingProducts /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><BestSellers /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><BrandExperience /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><StatsSection /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><Testimonials /></Suspense>
    </>
  );
}
