"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Camera, Shirt, Facebook, Code2 } from "lucide-react";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61588892652192";
const DEVELOPER_URL = "https://www.facebook.com/profile.php?id=61575052397653";
const MAP_URL = "https://maps.app.goo.gl/H11PhX67GndtaQXQ6";

function getSetting(settings: Record<string, string>, key: string, fallback: string) {
  const value = settings[key];
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

const defaultExperiences = [
  { icon: MapPin, titleKey: "brand_card_1_title", subtitleKey: "brand_card_1_subtitle", imageKey: "brand_card_1_image", ctaKey: "brand_card_1_cta", title: "Visit Our Flagship Store", subtitle: "Experience the brand in person in your town.", image: "https://i.postimg.cc/YqdQcFvk/7c1312d72dfe4825b1da3d931064957f.webp", cta: "Get Directions", href: MAP_URL },
  { icon: Camera, titleKey: "brand_card_2_title", subtitleKey: "brand_card_2_subtitle", imageKey: "brand_card_2_image", ctaKey: "brand_card_2_cta", title: "Behind The Scenes", subtitle: "See how we craft each collection with precision and care.", image: "https://i.postimg.cc/bvtn2F3c/656321089.webp", cta: "Watch Video on our FB page", href: undefined as string | undefined },
  { icon: Shirt, titleKey: "brand_card_3_title", subtitleKey: "brand_card_3_subtitle", imageKey: "brand_card_3_image", ctaKey: "brand_card_3_cta", title: "Shop The Look", subtitle: "Curated outfit combinations styled by our in-house team.", image: "https://i.postimg.cc/mDWH3N5c/1779873061510.webp", cta: "Explore Looks", href: undefined as string | undefined },
];

export default function BrandExperience({ settings = {} }: { settings?: Record<string, string> }) {
  const sectionTitle = getSetting(settings, "brand_section_title", "Experience Our Brand");
  const sectionSubtitle = getSetting(settings, "brand_section_subtitle", "More than just clothing — a lifestyle crafted for the modern Bangladeshi gentleman.");
  const facebookText = getSetting(settings, "facebook_follow_text", "Follow us on Facebook");
  const developerText = getSetting(settings, "developer_contact_text", "Contact the Developer");

  const experiences = defaultExperiences.map((item) => ({
    ...item,
    title: getSetting(settings, item.titleKey, item.title),
    subtitle: getSetting(settings, item.subtitleKey, item.subtitle),
    image: getSetting(settings, item.imageKey, item.image),
    cta: getSetting(settings, item.ctaKey, item.cta),
  }));

  return (
    <section className="py-16 md:py-24 bg-ink-950">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">{sectionTitle}</h2>
          <p className="text-ink-400 text-sm md:text-base max-w-xl mx-auto">{sectionSubtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-[#0f63d8] text-white text-sm font-semibold rounded-xl transition-colors">
              <Facebook className="w-4 h-4" />{facebookText}
            </Link>
            <Link href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2a2310] hover:bg-brand-700 text-brand-300 hover:text-white text-sm font-semibold rounded-xl border border-[#3a2e0f] hover:border-brand-600 transition-colors">
              <Code2 className="w-4 h-4" />{developerText}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {experiences.map((exp, i) => {
            const CardTag: any = exp.href ? "a" : "div";
            const linkProps = exp.href ? { href: exp.href, target: "_blank", rel: "noopener noreferrer" } : {};
            return (
            <CardTag key={exp.titleKey} {...linkProps} className="group relative block rounded-2xl overflow-hidden bg-ink-900 border border-ink-800 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="relative aspect-[4/3]">
                <Image src={exp.image} alt={exp.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105 opacity-60 group-hover:opacity-80" sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" />
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
            </CardTag>
            );
          })}
        </div>
      </div>
    </section>
  );
}
