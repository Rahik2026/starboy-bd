"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AnnouncementBar() {
  const [closed, setClosed] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("announcements").select("*").eq("active", true).eq("type", "bar").order("priority").limit(1);
      if (data) setAnnouncements(data);
    };
    load();
  }, []);

  const active = announcements[0];
  if (!active || closed) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-ink-950 text-brand-300 text-xs md:text-sm font-medium tracking-wide relative z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
          <span className="uppercase">{active.content}</span>
          <button onClick={() => setClosed(true)} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:text-white transition-colors" aria-label="Close announcement"><X className="w-3.5 h-3.5" /></button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
