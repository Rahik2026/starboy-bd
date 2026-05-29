"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";

function getSetting(data: any[], key: string, fallback: string): string {
  const exactDoc = data.find((item: any) => item.id === key);
  const byKey = data.find((item: any) => item.key === key);
  const value = exactDoc?.value ?? byKey?.value ?? fallback;
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export default function Hero() {
  const [settings, setSettings] = useState({
    hero_title: "THE MODERN STANDARD.",
    hero_subtitle: "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.",
    hero_cta_primary: "Shop New Arrivals",
    hero_cta_secondary: "Explore Collections",
  });

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const { data } = await firebaseData.from("settings").select("*");
        if (!cancelled && Array.isArray(data)) {
          setSettings({
            hero_title: getSetting(data, "hero_title", "THE MODERN STANDARD."),
            hero_subtitle: getSetting(data, "hero_subtitle", "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman."),
            hero_cta_primary: getSetting(data, "hero_cta_primary", "Shop New Arrivals"),
            hero_cta_secondary: getSetting(data, "hero_cta_secondary", "Explore Collections"),
          });
        }
      } catch (error) { console.error("Failed to load hero settings", error); }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, []);

  const title = String(settings.hero_title || "THE MODERN STANDARD.");
  const subtitle = String(settings.hero_subtitle || "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.");
  const cta1 = String(settings.hero_cta_primary || "Shop New Arrivals");
  const cta2 = String(settings.hero_cta_secondary || "Explore Collections");

  return (
    <section className="relative min-h-[68vh] md:min-h-[72vh] max-h-[760px] flex items-center overflow-hidden bg-[#1A1505]">
      <div className="absolute inset-0">
        <Image src="/images/hero-model.webp" alt="STARBOY BD Hero" fill className="object-cover object-top md:object-right opacity-90" style={{ objectPosition: "70% 20%" }} priority sizes="100vw" quality={75} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1505] via-[#1A1505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1505]/70 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-16 w-full">
        <div className="max-w-2xl">
          <div className="animate-fade-in">
            <span className="inline-block text-brand-400 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-4">Premium Menswear Bangladesh</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {title.split(".").map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 ? "." : ""}{i === 0 && arr.length > 1 ? <br /> : null}</span>
            ))}
          </h1>
          <p className="text-ink-300 text-base md:text-lg max-w-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "0.2s" }}>{subtitle}</p>
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow hover:shadow-lg">{cta1} <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 text-sm font-semibold rounded-xl transition-all">{cta2}</Link>
          </div>
        </div>
      </div>
      <div className="hidden lg:block absolute right-12 bottom-24 bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <div className="text-brand-400 text-2xl font-display font-bold">15K+</div>
        <div className="text-white/60 text-xs mt-0.5">Happy Customers</div>
      </div>
      <div className="hidden lg:block absolute right-32 top-32 bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.7s" }}>
        <div className="text-brand-400 text-2xl font-display font-bold">500+</div>
        <div className="text-white/60 text-xs mt-0.5">Premium Products</div>
      </div>
    </section>
  );
                      }
