"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Heart, ShoppingBag, MessageCircle, Settings, ChevronRight, Star, Package, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Message, Review } from "@/types";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "orders", label: "Orders", icon: Package },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { items: cartItems } = useCart();
  const [activeTab, setActiveTab] = useState("profile");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [m, r] = await Promise.all([
        supabase.from("messages").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
        supabase.from("reviews").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      ]);
      if (m.data) setMessages(m.data);
      if (r.data) setReviews(r.data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-ink-500 mb-4">Please login to view your dashboard.</p>
          <Link href="/auth" className="px-6 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-soft mb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-lg">{user.username.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="font-semibold text-ink-900 text-sm">{user.username}</div>
                  <div className="text-xs text-ink-500">{user.phone}</div>
                </div>
              </div>
            </div>
            <nav className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${activeTab === tab.id ? "bg-brand-50 text-brand-800 font-semibold" : "text-ink-600 hover:bg-ink-50"}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                  {tab.id === "wishlist" && wishlistItems.length > 0 && <span className="ml-auto text-[10px] bg-brand-200 text-brand-900 px-1.5 py-0.5 rounded-md font-bold">{wishlistItems.length}</span>}
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
            </nav>
          </aside>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">Profile</h2>
                  <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-soft space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-xs text-ink-500 mb-1 block">Username</label><div className="px-4 py-2.5 bg-ink-50 rounded-xl text-sm text-ink-900 font-medium">{user.username}</div></div>
                      <div><label className="text-xs text-ink-500 mb-1 block">Phone</label><div className="px-4 py-2.5 bg-ink-50 rounded-xl text-sm text-ink-900 font-medium">{user.phone}</div></div>
                      <div><label className="text-xs text-ink-500 mb-1 block">Email</label><div className="px-4 py-2.5 bg-ink-50 rounded-xl text-sm text-ink-900 font-medium">{user.email || "—"}</div></div>
                      <div><label className="text-xs text-ink-500 mb-1 block">Role</label><div className="px-4 py-2.5 bg-ink-50 rounded-xl text-sm text-ink-900 font-medium capitalize">{user.role}</div></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "wishlist" && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">My Wishlist ({wishlistItems.length})</h2>
                  {wishlistItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-ink-100 text-center text-ink-500 text-sm">No items saved yet. <Link href="/shop" className="text-brand-700 font-semibold hover:underline">Browse shop</Link></div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {wishlistItems.map((w) => (
                        <Link key={w.product.id} href={`/product/${w.product.slug}`} className="group block bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-soft hover:shadow-premium transition-shadow">
                          <div className="relative aspect-square bg-ink-50"><Image src={w.product.images[0]} alt={w.product.name} fill className="object-cover" /></div>
                          <div className="p-3"><div className="text-sm font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">{w.product.name}</div></div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">My Orders</h2>
                  <div className="bg-white rounded-2xl p-8 border border-ink-100 text-center text-ink-500 text-sm">No orders placed yet.</div>
                </motion.div>
              )}

              {activeTab === "messages" && (
                <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">Messages</h2>
                  <div className="bg-white rounded-2xl border border-ink-100 shadow-soft divide-y divide-ink-100">
                    {messages.length === 0 ? <div className="p-8 text-center text-ink-500 text-sm">No messages yet.</div> : messages.map((m) => (
                      <div key={m.id} className={`p-4 flex gap-3 ${m.sender === "admin" ? "bg-brand-50/50" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.sender === "admin" ? "bg-brand-200 text-brand-800" : "bg-ink-100 text-ink-600"}`}>{m.sender === "admin" ? "A" : "U"}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5"><span className="text-xs font-semibold text-ink-800">{m.sender === "admin" ? "STARBOY Support" : "You"}</span><span className="text-[10px] text-ink-400">{new Date(m.createdAt).toLocaleDateString()}</span></div>
                          <p className="text-sm text-ink-700">{m.text}</p>
                          {m.productName && <span className="inline-block mt-1.5 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">{m.productName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">My Reviews</h2>
                  {reviews.length === 0 ? <div className="bg-white rounded-2xl p-8 border border-ink-100 text-center text-ink-500 text-sm">No reviews posted yet.</div> : (
                    <div className="space-y-3">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-white rounded-2xl p-4 border border-ink-100 shadow-soft">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => (<Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-brand-500 fill-brand-500" : "text-ink-200"}`} />))}</div>
                          </div>
                          <p className="text-sm text-ink-700">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-ink-950 mb-4">Account Settings</h2>
                  <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-soft space-y-4">
                    <div><label className="text-xs text-ink-500 mb-1 block">Username</label><input defaultValue={user.username} className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500" /></div>
                    <div><label className="text-xs text-ink-500 mb-1 block">Email</label><input defaultValue={user.email || ""} className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500" /></div>
                    <button className="px-5 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">Save Changes</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
