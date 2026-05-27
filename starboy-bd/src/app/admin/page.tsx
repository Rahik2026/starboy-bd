"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Layers, MessageCircle, Megaphone, BarChart3,
  Plus, Pencil, Trash2, Search, Star, ArrowUpRight, ArrowDownRight, X,
  Database, CheckCircle2, Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Product, Category, Announcement, Message } from "@/types";
import { formatPrice } from "@/lib/utils";

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(true);
  const [setupRunning, setSetupRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"product" | "category" | "announcement" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: "", slug: "", shortDescription: "", fullDescription: "", images: [""],
    originalPrice: 0, offerPrice: undefined, categories: [], tags: [],
    availability: "in_stock", featured: false, trending: false, bestSeller: false,
    specs: {},
  });
  const [catForm, setCatForm] = useState<Partial<Category>>({
    name: "", slug: "", image: "", description: "", featured: false, priority: 0,
  });
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({
    title: "", content: "", type: "bar", active: false, ctaText: "", ctaLink: "", priority: 0,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [p, c, a, m] = await Promise.all([
      supabase.from("products").select("*").order("createdAt", { ascending: false }),
      supabase.from("categories").select("*").order("priority"),
      supabase.from("announcements").select("*").order("priority"),
      supabase.from("messages").select("*").order("createdAt", { ascending: false }),
    ]);
    if (p.error || c.error) setDbReady(false);
    setProducts(p.data || []);
    setCategories(c.data || []);
    setAnnouncements(a.data || []);
    setMessages(m.data || []);
    setLoading(false);
  };

  const runSetup = async () => {
    setSetupRunning(true);
    const res = await fetch("/api/setup-db", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setDbReady(true);
      await loadAll();
    }
    setSetupRunning(false);
  };

  // Modal helpers
  const openProductModal = (p?: Product) => {
    setEditingId(p?.id || null);
    setProdForm(p || { name: "", slug: "", shortDescription: "", fullDescription: "", images: [""], originalPrice: 0, offerPrice: undefined, categories: [], tags: [], availability: "in_stock", featured: false, trending: false, bestSeller: false, specs: {} });
    setModalType("product");
    setModalOpen(true);
  };
  const openCategoryModal = (c?: Category) => {
    setEditingId(c?.id || null);
    setCatForm(c || { name: "", slug: "", image: "", description: "", featured: false, priority: 0 });
    setModalType("category");
    setModalOpen(true);
  };
  const openAnnouncementModal = (a?: Announcement) => {
    setEditingId(a?.id || null);
    setAnnForm(a || { title: "", content: "", type: "bar", active: false, ctaText: "", ctaLink: "", priority: 0 });
    setModalType("announcement");
    setModalOpen(true);
  };

  const saveProduct = async () => {
    const payload = { ...prodForm, tags: Array.isArray(prodForm.tags) ? prodForm.tags : (prodForm.tags as string)?.split(",").map(t => t.trim()) || [] };
    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert(payload);
    }
    setModalOpen(false);
    loadAll();
  };
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadAll();
  };

  const saveCategory = async () => {
    if (editingId) {
      await supabase.from("categories").update(catForm).eq("id", editingId);
    } else {
      await supabase.from("categories").insert(catForm);
    }
    setModalOpen(false);
    loadAll();
  };
  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadAll();
  };

  const saveAnnouncement = async () => {
    if (editingId) {
      await supabase.from("announcements").update(annForm).eq("id", editingId);
    } else {
      await supabase.from("announcements").insert(annForm);
    }
    setModalOpen(false);
    loadAll();
  };
  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    loadAll();
  };

  if (authLoading) {
    return <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center grain">
        <div className="text-center">
          <p className="text-ink-400 mb-4">Please login to access admin.</p>
          <Link href="/auth" className="px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl">Login</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center grain">
        <div className="text-center">
          <p className="text-red-400 mb-4">Unauthorized. Admin access only.</p>
          <Link href="/" className="px-6 py-2.5 bg-ink-900 text-ink-300 text-sm font-semibold rounded-xl">Back Home</Link>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200 py-6 md:py-10 grain">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-start md:items-center justify-between gap-4 mb-8 flex-col md:flex-row">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-ink-500 mt-1">Manage your entire store from one place.</p>
          </div>
          {!dbReady && (
            <button onClick={runSetup} disabled={setupRunning} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors">
              {setupRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {setupRunning ? "Initializing..." : "Initialize Database"}
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-ink-900/50 backdrop-blur rounded-2xl border border-ink-800 overflow-hidden">
              {adminTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${activeTab === tab.id ? "bg-brand-900/30 text-brand-400 font-semibold" : "text-ink-400 hover:bg-ink-800/50 hover:text-ink-200"}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Products", value: products.length, change: "+4 this week", up: true },
                      { label: "Total Orders", value: "1,240", change: "+12%", up: true },
                      { label: "Revenue", value: "৳845K", change: "+8%", up: true },
                      { label: "Customers", value: "15,420", change: "+5%", up: true },
                    ].map((s) => (
                      <div key={s.label} className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-4">
                        <div className="text-xs text-ink-500 mb-1">{s.label}</div>
                        <div className="text-xl font-display font-bold text-white">{s.value}</div>
                        <div className={`flex items-center gap-1 text-[11px] mt-1 ${s.up ? "text-green-400" : "text-red-400"}`}>
                          {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {s.change}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">Recent Products</h3>
                    <div className="space-y-3">
                      {products.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-ink-800 overflow-hidden shrink-0">
                            {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" /> : <Package className="w-4 h-4 m-auto text-ink-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-200 truncate">{p.name}</div>
                            <div className="text-[11px] text-ink-500">{formatPrice(p.originalPrice)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "products" && (
                <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Products</h2>
                    <button onClick={() => openProductModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 bg-ink-900 border border-ink-800 rounded-xl text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-600" />
                  </div>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-ink-800 text-left text-xs text-ink-500 uppercase tracking-wider">
                            <th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-800/60">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-ink-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-8 h-8 rounded bg-ink-800 overflow-hidden shrink-0">
                                    {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" /> : <Package className="w-3 h-3 m-auto text-ink-600" />}
                                  </div>
                                  <span className="text-ink-200 font-medium truncate max-w-[120px] md:max-w-xs">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-ink-400">{formatPrice(p.offerPrice ?? p.originalPrice)}</td>
                              <td className="px-4 py-3 text-ink-400 capitalize">{p.availability?.replace("_", " ")}</td>
                              <td className="px-4 py-3"><div className="flex gap-1.5">{p.featured && <span className="text-[10px] bg-brand-900/40 text-brand-300 px-1.5 py-0.5 rounded">Featured</span>}{p.trending && <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">Trending</span>}</div></td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => openProductModal(p)} className="p-1.5 text-ink-400 hover:text-brand-400 hover:bg-brand-900/30 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-ink-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "categories" && (
                <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Categories</h2>
                    <button onClick={() => openCategoryModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> Add Category</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-4 flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-xl bg-ink-800 overflow-hidden shrink-0">
                          {cat.image ? <Image src={cat.image} alt={cat.name} fill className="object-cover" /> : <Layers className="w-5 h-5 m-auto text-ink-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink-200">{cat.name}</div>
                          <div className="text-[11px] text-ink-500">{cat.slug} • Priority {cat.priority}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => openCategoryModal(cat)} className="p-1.5 text-ink-400 hover:text-brand-400 hover:bg-brand-900/30 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-ink-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "messages" && (
                <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-white mb-4">Customer Messages</h2>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl divide-y divide-ink-800/60">
                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-ink-500 text-sm">No messages yet.</div>
                    ) : messages.map((m) => (
                      <div key={m.id} className="p-4 flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-900/50 text-brand-300 flex items-center justify-center text-xs font-bold shrink-0">{m.userName?.charAt(0) || "U"}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5"><span className="text-sm font-semibold text-ink-200">{m.userName}</span><span className="text-[11px] text-ink-500">{new Date(m.createdAt).toLocaleString()}</span></div>
                          <p className="text-sm text-ink-400">{m.text}</p>
                          {m.productName && <span className="inline-block mt-1.5 text-[10px] font-semibold text-brand-400 bg-brand-950 px-2 py-0.5 rounded-md border border-brand-900">{m.productName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "announcements" && (
                <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Announcements</h2>
                    <button onClick={() => openAnnouncementModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> New</button>
                  </div>
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className={`bg-ink-900/60 backdrop-blur border rounded-2xl p-4 ${a.active ? "border-brand-800/50" : "border-ink-800"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-ink-200">{a.title}</div>
                          <div className="flex gap-2">
                            <button onClick={() => openAnnouncementModal(a)} className="p-1.5 text-ink-400 hover:text-brand-400 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 text-ink-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-ink-400 mb-2">{a.content}</p>
                        <div className="flex gap-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${a.active ? "bg-green-900/30 text-green-400" : "bg-ink-800 text-ink-500"}`}>{a.active ? "Active" : "Inactive"}</span><span className="text-[10px] bg-ink-800 text-ink-500 px-1.5 py-0.5 rounded capitalize">{a.type}</span></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Page Views", value: "45.2K", sub: "+2.4%" },
                      { label: "Most Wishlisted", value: "Pink Poplin", sub: "248 saves" },
                      { label: "Cart Adds", value: "1,102", sub: "+18%" },
                      { label: "Conversion", value: "3.2%", sub: "-0.4%" },
                    ].map((s) => (
                      <div key={s.label} className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-4">
                        <div className="text-xs text-ink-500 mb-1">{s.label}</div>
                        <div className="text-lg font-display font-bold text-white">{s.value}</div>
                        <div className="text-[11px] text-brand-400 mt-0.5">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">Top Performing Products</h3>
                    <div className="space-y-3">
                      {products.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="text-xs text-ink-500 w-4">{i + 1}</div>
                          <div className="relative w-8 h-8 rounded bg-ink-800 overflow-hidden shrink-0">{p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" /> : <Package className="w-3 h-3 m-auto text-ink-600" />}</div>
                          <div className="flex-1 min-w-0"><div className="text-sm text-ink-200 truncate">{p.name}</div></div>
                          <div className="text-xs text-ink-500">{Math.floor(Math.random() * 500 + 100)} views</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display font-bold text-white">{editingId ? "Edit" : "Add"} {modalType === "product" ? "Product" : modalType === "category" ? "Category" : "Announcement"}</h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 text-ink-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              {modalType === "product" && (
                <div className="space-y-3">
                  <input value={prodForm.name || ""} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Product Name" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={prodForm.slug || ""} onChange={(e) => setProdForm({ ...prodForm, slug: e.target.value })} placeholder="Slug (e.g. pink-poplin-shirt)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={prodForm.shortDescription || ""} onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })} placeholder="Short Description" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={prodForm.fullDescription || ""} onChange={(e) => setProdForm({ ...prodForm, fullDescription: e.target.value })} placeholder="Full Description" rows={3} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={prodForm.images?.[0] || ""} onChange={(e) => setProdForm({ ...prodForm, images: [e.target.value] })} placeholder="Image URL" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={prodForm.originalPrice || 0} onChange={(e) => setProdForm({ ...prodForm, originalPrice: Number(e.target.value) })} placeholder="Original Price" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                    <input type="number" value={prodForm.offerPrice || ""} onChange={(e) => setProdForm({ ...prodForm, offerPrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="Offer Price (optional)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  </div>
                  <input value={Array.isArray(prodForm.tags) ? prodForm.tags.join(", ") : prodForm.tags || ""} onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value.split(",").map(t => t.trim()) })} placeholder="Tags (comma separated)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <select value={prodForm.availability || "in_stock"} onChange={(e) => setProdForm({ ...prodForm, availability: e.target.value as any })} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600">
                    <option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option><option value="pre_order">Pre Order</option>
                  </select>
                  <div className="flex gap-4 text-sm text-ink-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!prodForm.featured} onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })} /> Featured</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!prodForm.trending} onChange={(e) => setProdForm({ ...prodForm, trending: e.target.checked })} /> Trending</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!prodForm.bestSeller} onChange={(e) => setProdForm({ ...prodForm, bestSeller: e.target.checked })} /> Best Seller</label>
                  </div>
                  <button onClick={saveProduct} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Product</button>
                </div>
              )}

              {modalType === "category" && (
                <div className="space-y-3">
                  <input value={catForm.name || ""} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category Name" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={catForm.slug || ""} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="Slug" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={catForm.image || ""} onChange={(e) => setCatForm({ ...catForm, image: e.target.value })} placeholder="Image URL" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={catForm.description || ""} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <div className="flex gap-4 text-sm text-ink-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!catForm.featured} onChange={(e) => setCatForm({ ...catForm, featured: e.target.checked })} /> Featured</label>
                    <input type="number" value={catForm.priority || 0} onChange={(e) => setCatForm({ ...catForm, priority: Number(e.target.value) })} placeholder="Priority" className="w-20 px-2 py-1 bg-ink-950 border border-ink-800 rounded text-sm text-white" />
                  </div>
                  <button onClick={saveCategory} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Category</button>
                </div>
              )}

              {modalType === "announcement" && (
                <div className="space-y-3">
                  <input value={annForm.title || ""} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={annForm.content || ""} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} placeholder="Content" rows={2} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <select value={annForm.type || "bar"} onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as any })} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600">
                    <option value="bar">Top Bar</option><option value="banner">Banner</option><option value="popup">Popup</option>
                  </select>
                  <div className="flex gap-3">
                    <input value={annForm.ctaText || ""} onChange={(e) => setAnnForm({ ...annForm, ctaText: e.target.value })} placeholder="CTA Text" className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                    <input value={annForm.ctaLink || ""} onChange={(e) => setAnnForm({ ...annForm, ctaLink: e.target.value })} placeholder="CTA Link" className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-300"><input type="checkbox" checked={!!annForm.active} onChange={(e) => setAnnForm({ ...annForm, active: e.target.checked })} /> Active</label>
                  <button onClick={saveAnnouncement} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Announcement</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
