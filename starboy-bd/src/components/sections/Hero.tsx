"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center overflow-hidden bg-ink-950 grain">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=2000&auto=format&fit=crop"
          alt="STARBOY BD Hero"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
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
            THE MODERN <br />
            <span className="text-brand-400">STANDARD.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-ink-300 text-base md:text-lg max-w-lg mb-8 leading-relaxed"
          >
            Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.
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
              Shop New Arrivals <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/shop?category=urban-street"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 text-sm font-semibold rounded-xl transition-all backdrop-blur-sm"
            >
              Explore Collections
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Floating stat badges */}
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
