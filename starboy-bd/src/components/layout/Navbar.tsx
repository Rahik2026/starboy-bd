"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";
import MobileMenu from "./MobileMenu";

const navLinks = [
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "Men's", href: "/shop?category=mens-collection" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Collections", href: "/shop" },
  { label: "Sale", href: "/shop?filter=sale" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();
  const [categories, setCategories] = useState<Category[]>([]);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("priority").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-soft py-2.5"
            : "bg-surface py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-ink-900 hover:text-brand-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9">
              <svg viewBox="0 0 100 100" className="w-full h-full text-brand-700 fill-current">
                <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                SB
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg md:text-xl font-bold tracking-tight text-ink-950">
                STARBOY
              </span>
              <span className="text-[10px] font-semibold tracking-[0.25em] text-brand-700 uppercase">
                BD
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-ink-700 hover:text-brand-700 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 transition-all group-hover:w-full" />
              </Link>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-brand-700 transition-colors">
                Categories <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-premium border border-ink-100 overflow-hidden"
                  >
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-md bg-cover bg-center"
                          style={{ backgroundImage: `url(${cat.image})` }}
                        />
                        <span className="text-sm font-medium text-ink-800">{cat.name}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-ink-700 hover:text-brand-700 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/wishlist"
              className="hidden md:flex p-2 text-ink-700 hover:text-brand-700 transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="flex p-2 text-ink-700 hover:text-brand-700 transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full bg-ink-950 text-brand-300 text-xs font-semibold hover:bg-brand-700 hover:text-white transition-colors"
                >
                  <span className="max-w-[80px] truncate">{user.username}</span>
                  {isAdmin ? <LayoutDashboard className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </Link>
                <button onClick={logout} className="p-2 text-ink-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden md:flex items-center gap-2 ml-1 px-4 py-2 rounded-full bg-ink-950 text-brand-300 text-xs font-semibold hover:bg-brand-700 hover:text-white transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-sm flex items-start justify-center pt-24 md:pt-32 px-4"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-premium overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
                <Search className="w-5 h-5 text-ink-400" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="flex-1 outline-none text-ink-900 placeholder:text-ink-400 bg-transparent"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5 text-ink-500 hover:text-ink-900" />
                </button>
              </div>
              {searchQuery.length > 0 && (
                <div className="p-4 max-h-80 overflow-auto">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Trending</p>
                  <div className="flex flex-wrap gap-2">
                    {["Pink Poplin", "Oxford Shirt", "Leather Belt", "Urban Hoodie", "Aviators"].map((t) => (
                      <Link
                        key={t}
                        href={`/search?q=${encodeURIComponent(t)}`}
                        onClick={() => setSearchOpen(false)}
                        className="px-3 py-1.5 bg-ink-50 rounded-full text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 text-sm text-brand-700 font-medium hover:underline"
                    >
                      Search for &quot;{searchQuery}&quot;
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} />
    </>
  );
}
