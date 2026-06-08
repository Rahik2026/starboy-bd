"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingBag, Share2, MessageCircle, Truck, ShieldCheck, RefreshCcw,
  ChevronLeft, Star, Minus, Plus, Send, Phone,
} from "lucide-react";
import { firebaseData } from "@/lib/firebaseData";
import { db } from "@/lib/firebase";
import { doc as fsDoc, updateDoc as fsUpdateDoc, increment as fsIncrement } from "firebase/firestore";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ui/ProductCard";
import toast from "react-hot-toast";
import { Product, Review, ReviewReply } from "@/types";

const WHATSAPP_NUMBER = "8801884157883";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61588892652192";

export default function ProductClient({ initialProduct, initialRelated, initialReviews, slug }: { initialProduct: Product | null; initialRelated: Product[]; initialReviews: Review[]; slug: string }) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [related, setRelated] = useState<Product[]>(initialRelated || []);
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "chat">("details");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showReplyTo, setShowReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Track view + bump viewCount — ONCE per product per browser session.
  // Using an atomic increment() avoids the read-modify-write race (lost updates)
  // and the extra read; the session guard prevents write amplification from
  // re-renders, refreshes and the chat poll re-triggering effects.
  useEffect(() => {
    if (!product || !db) return;
    let cancelled = false;
    try {
      const seenKey = `sb_viewed_${product.id}`;
      if (sessionStorage.getItem(seenKey)) return; // already counted this session
      sessionStorage.setItem(seenKey, "1");
    } catch { /* ignore */ }

    // Atomic, race-free view count.
    fsUpdateDoc(fsDoc(db, "products", product.id), { viewCount: fsIncrement(1) }).catch(() => {});

    // Page view analytics — only for signed-in users, fire-and-forget.
    if (user && !cancelled) {
      firebaseData.from("page_views").insert({
        userId: user.id,
        username: user.username,
        path: `/product/${slug}`,
        productId: product.id,
        productName: product.name,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);


  // Load chat messages for this product. Polls only while the chat is open AND
  // the tab is visible — so a tab left open in the background stops polling and
  // doesn't quietly burn Firestore reads. Resumes when the user returns.
  useEffect(() => {
    if (!showChat || !product) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const loadChat = async () => {
      const { data } = await firebaseData.from("chat_messages").select("*").eq("productId", product.id).order("createdAt", { ascending: true });
      if (data) setChatMessages(data);
    };
    const start = () => {
      if (interval) return;
      loadChat();
      interval = setInterval(loadChat, 8000);
    };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [showChat, product?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Product Not Found</h1>
          <Link href="/shop" className="text-brand-700 text-sm hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.originalPrice, product.offerPrice);
  const isOutOfStock = product.availability === "out_of_stock" || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
  const currentPrice = product.offerPrice ?? product.originalPrice;
  const productImages = product.images || [];

  const handleAddToCart = () => {
    if (isOutOfStock) { toast.error("This item is out of stock"); return; }
    if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    for (let i = 0; i < quantity; i++) { addToCart(product, 1, selectedSize); }
    toast.success(`Added ${quantity} to cart`);
  };

  const handleWishlist = () => {
    if (!user) { toast.error("Please login to use wishlist"); return; }
    if (inWishlist) { removeFromWishlist(product.id); toast.success("Removed from wishlist"); }
    else { addToWishlist(product); toast.success("Saved to wishlist"); }
  };

  const sendChatMessage = async () => {
    if (!user) { toast.error("Please login to chat"); return; }
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await firebaseData.from("chat_messages").insert({
        productId: product.id,
        productName: product.name,
        userId: user.id,
        userName: user.username,
        text: newMessage.trim(),
        sender: "user",
        read: false,
        createdAt: new Date().toISOString(),
      });
      setNewMessage("");
      const { data } = await firebaseData.from("chat_messages").select("*").eq("productId", product.id).order("createdAt", { ascending: true });
      if (data) setChatMessages(data);
    } catch (err: any) {
      toast.error("Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const sendReply = async (reviewId: string) => {
    if (!user) { toast.error("Please login to reply"); return; }
    if (!replyText.trim()) return;
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    const reply: ReviewReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: user.id,
      userName: user.username,
      comment: replyText.trim(),
      createdAt: new Date().toISOString(),
      isAdmin: user.role === "admin",
    };
    const replies = [...(review.replies || []), reply];
    await firebaseData.from("reviews").update({ replies }).eq("id", reviewId);
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, replies } : r));
    setReplyText("");
    setShowReplyTo(null);
    toast.success("Reply posted");
  };

  const submitReview = async (rating: number, comment: string) => {
    if (!user) { toast.error("Please login to review"); return; }
    if (!comment.trim()) { toast.error("Please write a review"); return; }
    await firebaseData.from("reviews").insert({
      userId: user.id,
      userName: user.username,
      rating,
      comment: comment.trim(),
      productId: product.id,
      replies: [],
      createdAt: new Date().toISOString(),
    });
    const { data } = await firebaseData.from("reviews").select("*").eq("productId", product.id).order("createdAt", { ascending: false }).limit(20);
    if (data) setReviews(data);
    toast.success("Review submitted");
  };

  const returnPolicyText = product.returnEnabled === false
    ? (product.returnMessage || "Non-returnable")
    : product.returnPolicy === "exchange_only"
      ? (product.returnMessage || "Exchange available")
      : product.returnPolicy === "non_returnable"
        ? (product.returnMessage || "Non-returnable")
        : product.returnMessage || "7-day return policy";

  const couponText = product.couponMessage || "Buy & Get Free Coupons Up To 50%";

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-[4/5] bg-ink-50 rounded-2xl overflow-hidden mb-4">
              {productImages[selectedImage] && <Image src={productImages[selectedImage]} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority quality={75} />}
              {discount > 0 && <div className="absolute top-4 left-4 bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">{discount}% OFF</div>}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-ink-950 text-white text-sm font-bold px-5 py-2.5 rounded-full">Out of Stock</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-auto no-scrollbar">
              {productImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === i ? "border-brand-600" : "border-transparent"}`}>
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" quality={60} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-1"><span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{(product.categoryNames || product.categories || []).join(" / ").toUpperCase()}</span></div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl md:text-2xl font-bold text-ink-900">{formatPrice(currentPrice)}</span>
              {product.offerPrice && <span className="text-base text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>}
              {discount > 0 && <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">Save {formatPrice(product.originalPrice - (product.offerPrice ?? 0))}</span>}
            </div>
            <p className="text-ink-600 text-sm md:text-base leading-relaxed mb-6">{product.shortDescription}</p>

            {!isOutOfStock && product.stockQuantity !== undefined && product.stockQuantity > 0 && (
              <div className="text-xs text-green-700 font-semibold mb-3">{product.stockQuantity} items in stock</div>
            )}
            {isOutOfStock && <div className="text-xs text-red-600 font-semibold mb-3">Currently out of stock</div>}

            {product.availableSizes && product.availableSizes.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-ink-900 mb-3">Select Size</div>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg border text-sm font-bold transition-all ${
                        selectedSize === size
                          ? "bg-ink-950 border-ink-950 text-white"
                          : "bg-white border-ink-200 text-ink-600 hover:border-ink-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 border border-ink-200 rounded-xl px-2 py-1.5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock} className="p-1.5 hover:bg-ink-100 rounded-lg disabled:opacity-40"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} disabled={isOutOfStock} className="p-1.5 hover:bg-ink-100 rounded-lg disabled:opacity-40"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={handleAddToCart} disabled={isOutOfStock} className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl transition-colors ${isOutOfStock ? 'bg-ink-300 text-white cursor-not-allowed' : 'bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white'}`}>
                <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button onClick={handleWishlist} className={`p-3 rounded-xl border transition-colors ${inWishlist ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-ink-200 text-ink-600 hover:border-red-200 hover:text-red-600"}`}>
                <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
              </button>
              <button onClick={() => setShowChat(!showChat)} className="p-3 rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors" title="Chat about this product"><MessageCircle className="w-5 h-5" /></button>
            </div>

            {/* WhatsApp button */}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (${formatPrice(currentPrice)})`)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors mb-4">
              <Phone className="w-4 h-4" /> Message Seller on WhatsApp
            </a>

            {/* Trust badges - Updated (Req 8) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-2 text-xs text-ink-600 bg-white border border-ink-100 rounded-xl px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" /> {couponText}
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-600 bg-white border border-ink-100 rounded-xl px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" /> 100% Authentic
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-600 bg-white border border-ink-100 rounded-xl px-3 py-2.5">
                <RefreshCcw className="w-4 h-4 text-brand-600 flex-shrink-0" /> {returnPolicyText}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-ink-200 mb-4">
              <div className="flex gap-6">
                {(["details", "reviews", "chat"] as const).map((tab) => (
                  <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "chat") setShowChat(true); }} className={`pb-3 text-sm font-semibold capitalize transition-colors relative ${activeTab === tab ? "text-brand-700" : "text-ink-400 hover:text-ink-600"}`}>
                    {tab === "chat" ? "Ask Seller" : tab}
                    {activeTab === tab && <motion.div layoutId="product-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "details" && (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-sm text-ink-700 leading-relaxed space-y-4">
                  <p>{product.fullDescription}</p>
                  {product.specs && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (
                        <div key={k} className="bg-white border border-ink-100 rounded-xl px-4 py-3">
                          <div className="text-[11px] text-ink-400 uppercase tracking-wider mb-0.5">{k}</div>
                          <div className="font-medium text-ink-900">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {/* Add Review Form */}
                  <AddReviewForm onSubmit={submitReview} existing={reviews.find(r => r.userId === user?.id)} />
                  {reviews.length === 0 ? <p className="text-sm text-ink-500">No reviews yet. Be the first to review!</p> : reviews.map((r) => (
                    <div key={r.id} className="bg-white border border-ink-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs font-bold">{r.userName?.charAt(0) || "U"}</div>
                          <div>
                            <div className="text-sm font-semibold text-ink-900">{r.userName}</div>
                            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => (<Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-brand-500 fill-brand-500" : "text-ink-200"}`} />))}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-ink-700 mb-3">{r.comment}</p>
                      {/* Replies */}
                      {(r.replies || []).length > 0 && (
                        <div className="ml-8 space-y-2 mb-3">
                          {(r.replies || []).map((rep) => (
                            <div key={rep.id} className={`flex gap-2 p-2 rounded-lg ${rep.isAdmin ? "bg-brand-50 border border-brand-100" : "bg-ink-50"}`}>
                              <div className="w-6 h-6 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{rep.userName.charAt(0)}</div>
                              <div>
                                <span className="text-[10px] font-semibold text-ink-800">{rep.userName}{rep.isAdmin && " (Admin)"}</span>
                                <p className="text-xs text-ink-600">{rep.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Reply button */}
                      {user && (
                        <button onClick={() => setShowReplyTo(showReplyTo === r.id ? null : r.id)} className="text-xs text-brand-700 hover:underline font-medium">
                          {showReplyTo === r.id ? "Cancel Reply" : "Reply"}
                        </button>
                      )}
                      {showReplyTo === r.id && (
                        <div className="mt-2 ml-8 flex gap-2">
                          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 px-3 py-2 bg-ink-50 border border-ink-200 rounded-lg text-xs outline-none focus:border-brand-500" />
                          <button onClick={() => sendReply(r.id)} className="px-4 py-2 bg-brand-700 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors">Reply</button>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "chat" && (
                <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {showChat ? (
                    <div className="border border-ink-200 rounded-xl overflow-hidden">
                      <div className="bg-ink-950 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-brand-400" />
                          <span className="text-sm font-semibold">Chat about {product.name}</span>
                        </div>
                        <span className="text-[10px] text-ink-400">Live</span>
                      </div>
                      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-surface">
                        {chatMessages.length === 0 && <p className="text-sm text-ink-500 text-center py-8">No messages yet. Start the conversation!</p>}
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "admin" ? "bg-brand-700 text-white rounded-br-none" : "bg-white border border-ink-100 text-ink-800 rounded-bl-none"}`}>
                              <div className={`text-[10px] font-semibold mb-0.5 ${msg.sender === "admin" ? "text-brand-200" : "text-brand-700"}`}>{msg.userName}{msg.sender === "admin" && " (Seller)"}</div>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="flex gap-2 p-3 bg-white border-t border-ink-100">
                        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMessage()} placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500" />
                        <button onClick={sendChatMessage} disabled={sendingMsg || !newMessage.trim()} className="px-4 py-2.5 bg-brand-700 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-sm text-ink-500 mb-4">Click the chat icon above to open the chat.</p>
                      <button onClick={() => setShowChat(true)} className="px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">Open Chat</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 md:mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink-950 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{related.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddReviewForm({ onSubmit, existing }: { onSubmit: (rating: number, comment: string) => void; existing?: Review }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (existing) return null;

  return (
    <div className="bg-surface border border-ink-100 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-ink-900 mb-3">Write a Review</h3>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}><Star className={`w-5 h-5 ${i < rating ? "text-brand-500 fill-brand-500" : "text-ink-200"}`} /></button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 resize-none mb-3" />
      <button onClick={() => { onSubmit(rating, comment); setComment(""); }} disabled={!comment.trim()} className="px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50">Submit Review</button>
    </div>
  );
}
