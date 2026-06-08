"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, User, ArrowRight, Package, Clock, CheckCircle, XCircle, Eye, MessageCircle, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firebaseData } from "@/lib/firebaseData";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const load = async () => {
        const { data } = await firebaseData.from("orders").select("*").eq("userId", user.id).order("createdAt", { ascending: false }).limit(10);
        if (data) setOrders(data);
        setLoading(false);
      };
      load();
    } else { setLoading(false); }
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-500 mb-4">Please login to access your dashboard.</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">Login / Register</Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-brand-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-2xl font-bold">
              {user.avatar ? <Image src={user.avatar} alt={user.username} width={64} height={64} className="rounded-full object-cover" /> : user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-ink-950">{user.username}</h1>
              <p className="text-sm text-ink-500">{user.email}</p>
              <p className="text-xs text-ink-400">{user.phone || "No phone number"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: ShoppingBag, label: "My Orders", href: "#", color: "text-brand-600" },
            { icon: Heart, label: "Wishlist", href: "/wishlist", color: "text-red-500" },
            { icon: User, label: "Profile", href: "#", color: "text-ink-600" },
            { icon: Package, label: "Address", href: "#", color: "text-ink-600" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 text-center hover:shadow-premium transition-shadow">
              <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
              <span className="text-xs font-semibold text-ink-800">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6">
          <h2 className="font-display text-lg font-bold text-ink-950 mb-4">Recent Orders</h2>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-8">No orders yet. <Link href="/shop" className="text-brand-700 hover:underline">Start shopping</Link></p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="text-sm font-semibold text-ink-900">Order #{order.id.slice(0, 8)}</div>
                      <div className="text-xs text-ink-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink-900">{formatPrice(order.total)}</div>
                    <div className="text-xs text-ink-500 capitalize">{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
