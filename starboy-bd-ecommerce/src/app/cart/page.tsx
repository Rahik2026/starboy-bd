"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, MessageCircle, ArrowRight, Phone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

const WHATSAPP_NUMBER = "8801884157883";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");

  const handlePlaceOrder = () => {
    if (!fullName.trim() || !mobileNumber.trim() || !address.trim()) {
      toast.error("Please fill in all checkout fields");
      return;
    }

    const productDetails = items.map(item => 
      `- ${item.product.name}${item.size ? ` (Size: ${item.size})` : ""} x${item.quantity} = ${formatPrice((item.product.offerPrice ?? item.product.originalPrice) * item.quantity)}`
    ).join("\n");

    const message = `New Order Details:
Name: ${fullName}
Mobile: ${mobileNumber}
Address: ${address}

Ordered Products:
${productDetails}

Total Amount: ${formatPrice(totalPrice)}
`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-surface py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-8">Shopping Cart ({totalItems})</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
            <ShoppingBag className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-ink-800 mb-1">Your cart is empty</h2>
            <p className="text-sm text-ink-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={`${item.product.id}-${item.size || ''}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-4 bg-white rounded-2xl p-4 border border-ink-100 shadow-soft">
                    <Link href={`/product/${item.product.slug}`} className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-ink-50 flex-shrink-0">
                      {item.product.images?.[0] ? <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" /> : null}
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${item.product.slug}`} className="font-semibold text-ink-900 text-sm md:text-base hover:text-brand-700 transition-colors">{item.product.name}</Link>
                        {item.size && <p className="text-xs font-bold text-brand-700 mt-0.5">Size: {item.size}</p>}
                        <p className="text-xs text-ink-500 mt-0.5">{item.product.shortDescription}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-ink-200 rounded-lg px-1.5 py-1">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)} className="p-1 hover:bg-ink-100 rounded"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} className="p-1 hover:bg-ink-100 rounded"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-ink-900">{formatPrice((item.product.offerPrice ?? item.product.originalPrice) * item.quantity)}</span>
                          <button onClick={() => removeFromCart(item.product.id, item.size)} className="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-soft sticky top-24">
                <h3 className="font-display text-lg font-bold text-ink-950 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-ink-600 border-b border-ink-50 pb-3">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink-900">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-ink-950 uppercase tracking-wider">Delivery Details</h4>
                  <div>
                    <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name" 
                      className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-xl text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest block mb-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01xxxxxxxxx" 
                      className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-xl text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest block mb-1">Location / Address</label>
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House, Road, Area, City" 
                      rows={3}
                      className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-xl text-sm outline-none focus:border-brand-500 focus:bg-white transition-all resize-none" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-200"
                >
                  <Phone className="w-4 h-4" /> Place Order via WhatsApp
                </button>
                <p className="text-center text-[10px] text-ink-400 mt-4 leading-relaxed">
                  Tapping the button will open WhatsApp with your order details pre-filled.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
