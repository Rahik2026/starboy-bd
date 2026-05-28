"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, User, ChevronRight, Search, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Category } from "@/types";
import Image from "next/image";

export default function MobileMenu({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-ink-950/50 z-[70] backdrop-blur-sm" />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-[#F7F3EC] z-[80] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ink-100">
              <span className="font-display text-lg font-bold text-ink-950">STARBOY BD</span>
              <button onClick={onClose} className="p-2 text-ink-600 hover:text-ink-950"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200 border border-ink-100" />
                </div>
              </div>
              {user && (
                <div className="px-4 mt-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-ink-100">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-100 border border-brand-200">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.username} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-800 font-bold text-sm">{user.username.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{user.username}</div>
                      <div className="text-[10px] text-brand-700 font-semibold uppercase">{user.role}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="px-4 mt-4 space-y-1">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-2 mb-2">Menu</p>
                {[{ label: "New Arrivals", href: "/shop?sort=new" }, { label: "Men's Collection", href: "/shop?category=mens-collection" }, { label: "Accessories", href: "/shop?category=accessories" }, { label: "All Collections", href: "/shop" }, { label: "Sale", href: "/shop?filter=sale" }].map((item) => (
                  <Link key={item.label} href={item.href} onClick={onClose} className="flex items-center justify-between px-3 py-3 rounded-xl text-ink-800 hover:bg-brand-50 transition-colors">
                    <span className="text-sm font-medium">{item.label}</span><ChevronRight className="w-4 h-4 text-ink-400" />
                  </Link>
                ))}
              </div>
              {user && (
                <div className="px-4 mt-4 space-y-1">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-2 mb-2">Account</p>
                  <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 px-3 py-3 rounded-xl text-ink-800 hover:bg-brand-50 transition-colors">
                    <User className="w-4 h-4" /> <span className="text-sm font-medium">My Dashboard</span>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={onClose} className="flex items-center gap-2 px-3 py-3 rounded-xl text-ink-800 hover:bg-brand-50 transition-colors">
                      <Settings className="w-4 h-4" /> <span className="text-sm font-medium">Admin Panel</span>
                    </Link>
                  )}
                </div>
              )}
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
            <div className="p-4 border-t border-ink-100 space-y-2 bg-white/50">
              <div className="flex gap-3 mb-3">
                <Link href="/wishlist" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-ink-100 text-sm font-medium text-ink-800">
                  <Heart className="w-4 h-4" /> Wishlist {wishCount > 0 && `(${wishCount})`}
                </Link>
                <Link href="/cart" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-ink-100 text-sm font-medium text-ink-800">
                  <ShoppingBag className="w-4 h-4" /> Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
              </div>
              {user ? (
                <button onClick={() => { logout(); onClose(); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link href="/auth" onClick={onClose} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-ink-950 text-brand-300 text-sm font-semibold justify-center">
                  <User className="w-4 h-4" /> Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
