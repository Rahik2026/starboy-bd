"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Category } from "@/types";

export default function CategoryCard({ category, index = 0 }: { category: Category; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/shop?category=${category.slug}`} className="group block">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-ink-100">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <h3 className="text-white font-display text-lg md:text-xl font-semibold mb-0.5">{category.name}</h3>
            <p className="text-white/70 text-xs md:text-sm line-clamp-1">{category.description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
