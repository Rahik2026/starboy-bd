"use client";

import Link from "next/link";
import { Instagram, Facebook, Youtube, Twitter, CreditCard, Truck, ShieldCheck, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300 border-t border-ink-900">
      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-12 border-b border-ink-800">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-brand-300 mb-2">Subscribe to STARBOY BD</h3>
            <p className="text-sm text-ink-400">Get 10% off your first order and early access to new drops.</p>
          </div>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 bg-ink-900 border border-ink-800 rounded-xl text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-600 transition-colors"
              />
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
                <svg viewBox="0 0 100 100" className="w-full h-full text-brand-600 fill-current">
                  <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">SB</span>
              </div>
              <span className="font-display text-lg font-bold text-white">STARBOY BD</span>
            </Link>
            <p className="text-xs leading-relaxed text-ink-400 mb-4">
              The modern standard for menswear in Bangladesh. Premium quality, timeless design, and an
              uncompromising commitment to style.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-ink-900 hover:bg-brand-900 text-ink-400 hover:text-brand-300 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["New Arrivals", "Men's", "Accessories", "Collections", "Sale"].map((item) => (
                <li key={item}>
                  <Link href="/shop" className="text-xs text-ink-400 hover:text-brand-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {["Customer Service", "Shipping & Returns", "Contact Us", "Privacy Policy", "Size Guides"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-xs text-ink-400 hover:text-brand-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Payment Methods</h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-6 bg-ink-800 rounded flex items-center justify-center text-[8px] text-ink-500">
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

        <div className="mt-12 pt-6 border-t border-ink-900 flex flex-col md:flex-row items-center justify-between gap-3">
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
