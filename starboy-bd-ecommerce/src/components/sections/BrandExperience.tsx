"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Camera, Shirt, Facebook } from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61588892652192";

function getSetting(settings: Record<string, string>, key: string, fallback: string) {
  const value = settings[key];
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

const defaultExperiences = [
  {
    icon: MapPin,
    titleKey: "brand_card_1_title",
    subtitleKey: "brand_card_1_subtitle",
    imageKey: "brand_card_1_image",
    ctaKey: "brand_card_1_cta",
    title: "Visit Our Flagship Store",
    subtitle: "Experience the brand in person at our Dhaka location.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
    cta: "Get Directions",
  },
  {
    icon: Camera,
    titleKey: "brand_card_2_title",
    subtitleKey: "brand_card_2_subtitle",
    imageKey: "brand_card_2_image",
    ctaKey: "brand_card_2_cta",
    title: "Behind The Scenes",
    subtitle: "See how we craft each collection with precision and care.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop",
    cta: "Watch Video",
  },
  {
    icon: Shirt,
    titleKey: "brand_card_3_title",
    subtitleKey: "brand_card_3_subtitle",
    imageKey: "brand_card_3_image",
    ctaKey: "brand_card_3_cta",
    title: "Shop The Look",
    subtitle: "Curated outfit combinations styled by our in-house team.",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800&auto=format&fit=crop",
    cta: "Explore Looks",
  },
];

export default function BrandExperience() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const { data } = await firebaseData.from("settings").select("*");

        if (!cancelled && Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((item: any) => {
            if (item?.key) map[item.key] = String(item.value ?? "");
          });
          setSettings(map);
        }
      } catch (error) {
        console.error("Failed to load brand experience settings", error);
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const sectionTitle = getSetting(settings, "brand_section_title", "Experience Our Brand");
  const sectionSubtitle = getSetting(
    settings,
    "brand_section_subtitle",
    "More than just clothing — a lifestyle crafted for the modern Bangladeshi gentleman."
  );
  const facebookText = getSetting(settings, "facebook_follow_text", "Follow us on Facebook");

  const experiences = defaultExperiences.map((item) => ({
    ...item,
    title: getSetting(settings, item.titleKey, item.title),
    subtitle: getSetting(settings, item.subtitleKey, item.subtitle),
    image: getSetting(settings, item.imageKey, item.image),
    cta: getSetting(settings, item.ctaKey, item.cta),
  }));

  return (
    <section className="py-16 md:py-24 bg-ink-950 grain">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            {sectionTitle}
          </h2>
          <p className="text-ink-400 text-sm md:text-base max-w-xl mx-auto">
            {sectionSubtitle}
          </p>
          <Link
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-[#1877F2] hover:bg-[#0f63d8] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Facebook className="w-4 h-4" />
            {facebookText}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.titleKey}
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
                  sizes="(max-width: 768px) 100vw, 33vw"
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
