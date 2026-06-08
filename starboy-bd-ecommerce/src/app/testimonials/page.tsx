"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Send } from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";
import { useAuth } from "@/context/AuthContext";
import { Testimonial } from "@/types";
import toast from "react-hot-toast";

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    firebaseData.from("testimonials").select("*").eq("active", true).order("createdAt", { ascending: false }).then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, []);

  const handleLike = async (id: string) => {
    if (!user) { toast.error("Please login to like"); return; }
    const item = items.find((t) => t.id === id);
    if (!item) return;
    const likes = item.likes || [];
    const hasLiked = likes.includes(user.id);
    const newLikes = hasLiked ? likes.filter((l) => l !== user.id) : [...likes, user.id];
    await firebaseData.from("testimonials").update({ likes: newLikes }).eq("id", id);
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, likes: newLikes } : t));
  };

  const handleComment = async (id: string) => {
    if (!user) { toast.error("Please login to comment"); return; }
    if (!commentText.trim()) return;
    const item = items.find((t) => t.id === id);
    if (!item) return;
    const comment = { id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, userName: user.username, text: commentText.trim(), createdAt: new Date().toISOString() };
    const comments = [...(item.comments || []), comment];
    await firebaseData.from("testimonials").update({ comments }).eq("id", id);
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, comments } : t));
    setCommentText("");
    setOpenCommentId(null);
    toast.success("Comment added");
  };

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-surface py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-ink-950 mb-4">Customer Testimonials</h1>
          <p className="text-ink-500 text-base md:text-lg max-w-2xl mx-auto">Real stories from our valued customers across Bangladesh.</p>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl"><p className="text-ink-500">No testimonials yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((item, i) => (
              <div key={item.id} className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-soft hover:shadow-premium transition-shadow animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="relative aspect-[4/3]">
                  <Image src={item.customerImage} alt={item.customerName} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
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
                <div className="p-5">
                  <p className="text-ink-700 text-sm leading-relaxed mb-4">&quot;{item.description}&quot;</p>
                  <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(item.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${(item.likes || []).includes(user?.id || "") ? "text-red-500" : "text-ink-500 hover:text-red-500"}`}>
                        <Heart className={`w-4 h-4 ${(item.likes || []).includes(user?.id || "") ? "fill-current" : ""}`} />{(item.likes || []).length}
                      </button>
                      <button onClick={() => setOpenCommentId(openCommentId === item.id ? null : item.id)} className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-700 transition-colors">
                        <MessageCircle className="w-4 h-4" />{item.comments?.length || 0}
                      </button>
                    </div>
                    {item.productId && <span className="text-xs text-brand-700">View Product</span>}
                  </div>
                  {openCommentId === item.id && (
                    <div className="mt-3 pt-3 space-y-2">
                      {(item.comments || []).map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{c.userName.charAt(0)}</div>
                          <div className="bg-ink-50 rounded-lg px-3 py-2 flex-1">
                            <div className="text-[10px] font-semibold text-ink-800">{c.userName}</div>
                            <p className="text-xs text-ink-600">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 bg-ink-50 border border-ink-200 rounded-lg text-xs outline-none focus:border-brand-500" />
                        <button onClick={() => handleComment(item.id)} className="p-2 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition-colors"><Send className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
