"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, Facebook, Youtube, MapPin, CreditCard, Truck, ShieldCheck, Mail } from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";
import Image from "next/image";

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    firebaseData.from("settings").select("*").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: any) => (map[s.key] = s.value));
        setSettings(map);
      }
    });
  }, []);

  const outletText = settings.footer_outlet_text || "You are welcome to our outlet";
  const outletLoc = settings.footer_outlet_location || "Korim mes, College road, Satkhira";

  return (
    <footer className="bg-[#1A1505] text-[#C9A96E] border-t border-[#3a2e0f]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-12 border-b border-[#3a2e0f]">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-brand-300 mb-2">{outletText}</h3>
            <div className="flex items-start gap-2 text-sm text-ink-400 mt-3">
              <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
              <span className="text-[#C9A96E]/80">{outletLoc}</span>
            </div>
          </div>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input type="email" placeholder="Email address" className="w-full pl-10 pr-4 py-3 bg-[#2a2310] border border-[#3a2e0f] rounded-xl text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-600 transition-colors" />
            </div>
            <button className="px-6 py-3 bg-brand-700 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8">
                <Image src="/images/logo.png" alt="STARBOY BD" fill className="object-contain" />
              </div>
              <span className="font-display text-lg font-bold text-white">STARBOY BD</span>
            </Link>
            <p className="text-xs leading-relaxed text-ink-400 mb-4">
              The modern standard for menswear in Bangladesh. Premium quality, timeless design, and an uncompromising commitment to style.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-[#2a2310] hover:bg-brand-900 text-ink-400 hover:text-brand-300 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["New Arrivals", "Men's", "Accessories", "Collections", "Sale"].map((item) => (
                <li key={item}><Link href="/shop" className="text-xs text-ink-400 hover:text-brand-300 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {["Customer Service", "Shipping & Returns", "Contact Us", "Privacy Policy", "Size Guides"].map((item) => (
                <li key={item}><Link href="#" className="text-xs text-ink-400 hover:text-brand-300 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Payment Methods</h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-6 bg-[#2a2310] rounded flex items-center justify-center text-[8px] text-ink-500">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <Truck className="w-3.5 h-3.5 text-brand-600" /> Free Delivery over ৳5,000
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> 100% Secure Payments
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#3a2e0f] flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-ink-500">
            © {new Date().getFullYear()} STARBOY BD. All Rights Reserved.
          </p>
          <div className="flex gap-4 text-[11px] text-ink-500">
            <Link href="#" className="hover:text-ink-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-ink-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-ink-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
