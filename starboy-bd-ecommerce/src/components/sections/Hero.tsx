"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
    hero_subtitle:
      "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.",
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
            hero_subtitle: getSetting(
              data,
              "hero_subtitle",
              "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman."
            ),
            hero_cta_primary: getSetting(
              data,
              "hero_cta_primary",
              "Shop New Arrivals"
            ),
            hero_cta_secondary: getSetting(
              data,
              "hero_cta_secondary",
              "Explore Collections"
            ),
          });
        }
      } catch (error) {
        console.error("Failed to load hero settings", error);
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const title = String(settings.hero_title || "THE MODERN STANDARD.");
  const subtitle = String(
    settings.hero_subtitle ||
      "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman."
  );
  const cta1 = String(settings.hero_cta_primary || "Shop New Arrivals");
  const cta2 = String(settings.hero_cta_secondary || "Explore Collections");

  return (
    <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center overflow-hidden bg-[#1A1505] grain">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-model.png"
          alt="STARBOY BD Hero"
          fill
          className="object-cover object-top md:object-right opacity-90"
          style={{ objectPosition: "70% 20%" }}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1505] via-[#1A1505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1505]/70 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-20 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-brand-400 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Premium Menswear Bangladesh
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-5"
          >
            {title.split(".").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 ? "." : ""}
                {i === 0 && arr.length > 1 ? <br /> : null}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-ink-300 text-base md:text-lg max-w-lg mb-8 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow hover:shadow-lg"
            >
              {cta1} <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/shop?category=urban-street"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 text-sm font-semibold rounded-xl transition-all backdrop-blur-sm"
            >
              {cta2}
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden lg:block absolute right-12 bottom-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5"
      >
        <div className="text-brand-400 text-2xl font-display font-bold">15K+</div>
        <div className="text-white/60 text-xs mt-0.5">Happy Customers</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="hidden lg:block absolute right-32 top-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5"
      >
        <div className="text-brand-400 text-2xl font-display font-bold">500+</div>
        <div className="text-white/60 text-xs mt-0.5">Premium Products</div>
      </motion.div>
    </section>
  );
}
