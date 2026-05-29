"use client";

import { useState, useEffect } from "react";
import { Star, Heart, MessageCircle, Send, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { firebaseData } from "@/lib/firebaseData";
import { useAuth } from "@/context/AuthContext";
import { Testimonial } from "@/types";
import toast from "react-hot-toast";

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    firebaseData.from("testimonials").select("*").eq("active", true).order("createdAt", { ascending: false }).limit(6).then(({ data }) => {
      if (data) setItems(data);
    });
  }, []);

  const handleLike = async (testimonialId: string) => {
    if (!user) { toast.error("Please login to like"); return; }
    const item = items.find((t) => t.id === testimonialId);
    if (!item) return;
    const likes = item.likes || [];
    const hasLiked = likes.includes(user.id);
    const newLikes = hasLiked ? likes.filter((l) => l !== user.id) : [...likes, user.id];
    await firebaseData.from("testimonials").update({ likes: newLikes }).eq("id", testimonialId);
    setItems((prev) => prev.map((t) => t.id === testimonialId ? { ...t, likes: newLikes } : t));
  };

  const handleComment = async (testimonialId: string) => {
    if (!user) { toast.error("Please login to comment"); return; }
    if (!commentText.trim()) return;
    const item = items.find((t) => t.id === testimonialId);
    if (!item) return;
    const comment = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: user.id,
      userName: user.username,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const comments = [...(item.comments || []), comment];
    await firebaseData.from("testimonials").update({ comments }).eq("id", testimonialId);
    setItems((prev) => prev.map((t) => t.id === testimonialId ? { ...t, comments } : t));
    setCommentText("");
    setOpenCommentId(null);
    toast.success("Comment added");
  };

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">Customer Testimonials</h2>
          <p className="text-ink-500 text-sm md:text-base max-w-xl mx-auto">Real stories from the STARBOY BD community across Bangladesh.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {items.map((item, i) => (
            <div key={item.id} className="bg-surface rounded-2xl border border-ink-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="relative aspect-[4/3]">
                <Image src={item.customerImage} alt={item.customerName} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{item.customerName.charAt(0)}</div>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.customerName}</div>
                      {item.productName && <div className="text-brand-300 text-xs">Purchased: {item.productName}</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-ink-700 text-sm leading-relaxed mb-3">&quot;{item.description}&quot;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleLike(item.id)} className={`flex items-center gap-1 text-xs font-medium transition-colors ${(item.likes || []).includes(user?.id || "") ? "text-red-500" : "text-ink-500 hover:text-red-500"}`}>
                      <Heart className={`w-3.5 h-3.5 ${(item.likes || []).includes(user?.id || "") ? "fill-current" : ""}`} />{item.likes?.length || 0}
                    </button>
                    <button onClick={() => setOpenCommentId(openCommentId === item.id ? null : item.id)} className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-brand-700 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />{item.comments?.length || 0}
                    </button>
                  </div>
                  {item.productId && <Link href={`/product/${item.productId}`} className="text-xs text-brand-700 hover:underline">View Product</Link>}
                </div>
                {openCommentId === item.id && (
                  <div className="mt-3 pt-3 border-t border-ink-100">
                    {(item.comments || []).map((c) => (
                      <div key={c.id} className="flex gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{c.userName.charAt(0)}</div>
                        <div className="bg-white rounded-lg px-3 py-2 flex-1">
                          <div className="text-[10px] font-semibold text-ink-800">{c.userName}</div>
                          <p className="text-xs text-ink-600">{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 bg-white border border-ink-200 rounded-lg text-xs outline-none focus:border-brand-500" />
                      <button onClick={() => handleComment(item.id)} className="p-2 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition-colors"><Send className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
