"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Camera, Shirt } from "lucide-react";

const experiences = [
  {
    icon: MapPin,
    title: "Visit Our Flagship Store",
    subtitle: "Experience the brand in person at our Dhaka location.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
    cta: "Get Directions",
  },
  {
    icon: Camera,
    title: "Behind The Scenes",
    subtitle: "See how we craft each collection with precision and care.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop",
    cta: "Watch Video",
  },
  {
    icon: Shirt,
    title: "Shop The Look",
    subtitle: "Curated outfit combinations styled by our in-house team.",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800&auto=format&fit=crop",
    cta: "Explore Looks",
  },
];

export default function BrandExperience() {
  return (
    <section className="py-16 md:py-24 bg-ink-950 grain">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            Experience Our Brand
          </h2>
          <p className="text-ink-400 text-sm md:text-base max-w-xl mx-auto">
            More than just clothing — a lifestyle crafted for the modern Bangladeshi gentleman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl overflow-hidden bg-ink-900 border border-ink-800"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="flex items-center gap-2 text-brand-400 mb-2">
                  <exp.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{exp.cta}</span>
                </div>
                <h3 className="text-white font-display text-lg md:text-xl font-semibold mb-1">{exp.title}</h3>
                <p className="text-ink-400 text-xs md:text-sm">{exp.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
