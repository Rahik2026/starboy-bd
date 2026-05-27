"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, User, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Category } from "@/types";

export default function MobileMenu({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const { user, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-ink-950/50 z-[70] backdrop-blur-sm" />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-white z-[80] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ink-100">
              <span className="font-display text-lg font-bold text-ink-950">STARBOY BD</span>
              <button onClick={onClose} className="p-2 text-ink-600 hover:text-ink-950"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 bg-ink-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200" />
                </div>
              </div>
              <div className="px-4 mt-4 space-y-1">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-2 mb-2">Menu</p>
                {[{ label: "New Arrivals", href: "/shop?sort=new" }, { label: "Men's Collection", href: "/shop?category=mens-collection" }, { label: "Accessories", href: "/shop?category=accessories" }, { label: "All Collections", href: "/shop" }, { label: "Sale", href: "/shop?filter=sale" }].map((item) => (
                  <Link key={item.label} href={item.href} onClick={onClose} className="flex items-center justify-between px-3 py-3 rounded-xl text-ink-800 hover:bg-brand-50 transition-colors">
                    <span className="text-sm font-medium">{item.label}</span><ChevronRight className="w-4 h-4 text-ink-400" />
                  </Link>
                ))}
              </div>
              <div className="px-4 mt-6 space-y-1">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-2 mb-2">Categories</p>
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/shop?category=${cat.slug}`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-ink-800 hover:bg-brand-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${cat.image})` }} />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-ink-100 space-y-2 bg-ink-50/50">
              <div className="flex gap-3 mb-3">
                <Link href="/wishlist" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-ink-100 text-sm font-medium text-ink-800"><Heart className="w-4 h-4" /> Wishlist {wishCount > 0 && `(${wishCount})`}</Link>
                <Link href="/cart" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-ink-100 text-sm font-medium text-ink-800"><ShoppingBag className="w-4 h-4" /> Cart {cartCount > 0 && `(${cartCount})`}</Link>
              </div>
              {user ? (
                <div className="space-y-2">
                  <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-ink-950 text-brand-300 text-sm font-semibold justify-center"><User className="w-4 h-4" /> My Account</Link>
                  <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-700 text-sm font-medium justify-center">Sign Out</button>
                </div>
              ) : (
                <Link href="/auth" onClick={onClose} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-ink-950 text-brand-300 text-sm font-semibold justify-center"><User className="w-4 h-4" /> Login / Register</Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
