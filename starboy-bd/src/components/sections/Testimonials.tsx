"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Review } from "@/types";

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    supabase.from("reviews").select("*").order("createdAt", { ascending: false }).limit(6).then(({ data }) => {
      if (data) setReviews(data);
    });
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink-950 mb-3">What Our Customers Say</h2>
          <p className="text-ink-500 text-sm md:text-base max-w-xl mx-auto">Real reviews from the STARBOY BD community across Bangladesh.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {reviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-surface rounded-2xl p-6 md:p-8 border border-ink-100 shadow-soft hover:shadow-premium transition-shadow">
              <Quote className="w-8 h-8 text-brand-200 mb-4" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (<Star key={s} className={`w-4 h-4 ${s < review.rating ? "text-brand-500 fill-brand-500" : "text-ink-200"}`} />))}
              </div>
              <p className="text-ink-700 text-sm leading-relaxed mb-5">&quot;{review.comment}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">{review.userName?.charAt(0) || "U"}</div>
                <div>
                  <div className="text-sm font-semibold text-ink-900">{review.userName}</div>
                  <div className="text-xs text-ink-500">Verified Buyer</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
