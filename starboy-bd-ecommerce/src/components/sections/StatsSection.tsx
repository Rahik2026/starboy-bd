"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Package, ShoppingCart, Star, TrendingUp, Award } from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";

const iconMap: Record<string, React.ElementType> = {
  Users, Package, ShoppingCart, Star, TrendingUp, Award,
};

export default function StatsSection() {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    firebaseData.from("stats").select("*").eq("active", true).order("priority").then(({ data }) => {
      if (data) setStats(data);
    });
  }, []);

  if (stats.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-[#1A1505] grain">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => {
            const IconComp = iconMap[stat.icon] || Star;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2a2310] text-brand-400 mb-3">
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-brand-300/70 text-xs md:text-sm font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
