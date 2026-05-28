"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Layers, MessageCircle, Megaphone, BarChart3,
  Plus, Pencil, Trash2, Search, ArrowUpRight, ArrowDownRight, X,
  Database, Loader2, Settings, Star, Save, ToggleLeft, ToggleRight,
  Users, ShoppingCart, PackageOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firebaseData } from "@/lib/firebaseData";
import { initializeFirebaseDatabase } from "@/lib/firestoreSeed";
import { Product, Category, Announcement, Message } from "@/types";
import { formatPrice } from "@/lib/utils";

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "stats", label: "Site Stats", icon: BarChart3 },
  { id: "cms", label: "CMS / Settings", icon: Settings },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(true);
  const [setupRunning, setSetupRunning] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Product form
  const [pfName, setPfName] = useState("");
  const [pfSlug, setPfSlug] = useState("");
  const [pfShort, setPfShort] = useState("");
  const [pfFull, setPfFull] = useState("");
  const [pfImage, setPfImage] = useState("");
  const [pfOrig, setPfOrig] = useState(0);
  const [pfOffer, setPfOffer] = useState<number | undefined>(undefined);
  const [pfTags, setPfTags] = useState("");
  const [pfAvail, setPfAvail] = useState("in_stock");
  const [pfStock, setPfStock] = useState(0);
  const [pfFeat, setPfFeat] = useState(false);
  const [pfTrend, setPfTrend] = useState(false);
  const [pfBest, setPfBest] = useState(false);

  // Category form
  const [cfName, setCfName] = useState("");
  const [cfSlug, setCfSlug] = useState("");
  const [cfImage, setCfImage] = useState("");
  const [cfDesc, setCfDesc] = useState("");
  const [cfFeat, setCfFeat] = useState(false);
  const [cfPriority, setCfPriority] = useState(0);

  // Announcement form
  const [afTitle, setAfTitle] = useState("");
  const [afContent, setAfContent] = useState("");
  const [afType, setAfType] = useState("bar");
  const [afActive, setAfActive] = useState(false);
  const [afCtaText, setAfCtaText] = useState("");
  const [afCtaLink, setAfCtaLink] = useState("");

  // Stat form
  const [sfLabel, setSfLabel] = useState("");
  const [sfValue, setSfValue] = useState("");
  const [sfSuffix, setSfSuffix] = useState("");
  const [sfIcon, setSfIcon] = useState("Users");
  const [sfActive, setSfActive] = useState(true);
  const [sfPriority, setSfPriority] = useState(0);

  // CMS / Settings
  const [editSettingKey, setEditSettingKey] = useState<string | null>(null);
  const [editSettingValue, setEditSettingValue] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [p, c, a, m, s, sets] = await Promise.all([
      firebaseData.from("products").select("*").order("createdAt", { ascending: false }),
      firebaseData.from("categories").select("*").order("priority"),
      firebaseData.from("announcements").select("*").order("priority"),
      firebaseData.from("messages").select("*").order("createdAt", { ascending: false }),
      firebaseData.from("stats").select("*").order("priority"),
      firebaseData.from("settings").select("*"),
    ]);
    if (p.error || c.error) {
      setDbReady(false);
    } else {
      setDbReady(Boolean((p.data?.length || 0) > 0 && (c.data?.length || 0) > 0));
    }
    if (p.data) setProducts(p.data);
    if (c.data) setCategories(c.data);
    if (a.data) setAnnouncements(a.data);
    if (m.data) setMessages(m.data);
    if (s.data) setStats(s.data);
    if (sets.data) setSettings(sets.data);
    setLoading(false);
  };

  const runSetup = async () => {
    setSetupRunning(true);
    try {
      await initializeFirebaseDatabase();
      setDbReady(true);
      await loadAll();
      alert("Firebase Firestore database initialized successfully.");
    } catch (err: any) {
      alert(err?.message || "Failed to initialize Firebase Firestore database");
    } finally {
      setSetupRunning(false);
    }
  };

  // --- Product CRUD ---
  const openProductModal = (p?: Product) => {
    setEditingId(p?.id || null);
    setPfName(p?.name || "");
    setPfSlug(p?.slug || "");
    setPfShort(p?.shortDescription || "");
    setPfFull(p?.fullDescription || "");
    setPfImage(p?.images?.[0] || "");
    setPfOrig(p?.originalPrice || 0);
    setPfOffer(p?.offerPrice ?? undefined);
    setPfTags((p?.tags || []).join(", "));
    setPfAvail(p?.availability || "in_stock");
    setPfStock(p?.stockQuantity ?? 0);
    setPfFeat(!!p?.featured);
    setPfTrend(!!p?.trending);
    setPfBest(!!p?.bestSeller);
    setModalType("product");
    setModalOpen(true);
  };

  const saveProduct = async () => {
    const payload: any = {
      name: pfName, slug: pfSlug, shortDescription: pfShort, fullDescription: pfFull,
      images: pfImage ? [pfImage] : [], originalPrice: pfOrig,
      offerPrice: pfOffer !== undefined && !isNaN(pfOffer) ? pfOffer : null,
      tags: pfTags.split(",").map((t) => t.trim()).filter(Boolean),
      availability: pfAvail, stockQuantity: pfStock,
      featured: pfFeat, trending: pfTrend, bestSeller: pfBest,
    };
    if (editingId) {
      await firebaseData.from("products").update(payload).eq("id", editingId);
    } else {
      await firebaseData.from("products").insert(payload);
    }
    setModalOpen(false); loadAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await firebaseData.from("products").delete().eq("id", id);
    loadAll();
  };

  // --- Category CRUD ---
  const openCategoryModal = (c?: Category) => {
    setEditingId(c?.id || null);
    setCfName(c?.name || ""); setCfSlug(c?.slug || ""); setCfImage(c?.image || "");
    setCfDesc(c?.description || ""); setCfFeat(!!c?.featured); setCfPriority(c?.priority || 0);
    setModalType("category"); setModalOpen(true);
  };
  const saveCategory = async () => {
    const payload = { name: cfName, slug: cfSlug, image: cfImage, description: cfDesc, featured: cfFeat, priority: cfPriority };
    if (editingId) await firebaseData.from("categories").update(payload).eq("id", editingId);
    else await firebaseData.from("categories").insert(payload);
    setModalOpen(false); loadAll();
  };
  const deleteCategory = async (id: string) => { if (!confirm("Delete?")) return; await firebaseData.from("categories").delete().eq("id", id); loadAll(); };

  // --- Announcement CRUD ---
  const openAnnModal = (a?: Announcement) => {
    setEditingId(a?.id || null);
    setAfTitle(a?.title || ""); setAfContent(a?.content || ""); setAfType(a?.type || "bar");
    setAfActive(!!a?.active); setAfCtaText(a?.ctaText || ""); setAfCtaLink(a?.ctaLink || "");
    setModalType("announcement"); setModalOpen(true);
  };
  const saveAnn = async () => {
    const payload = { title: afTitle, content: afContent, type: afType, active: afActive, ctaText: afCtaText || null, ctaLink: afCtaLink || null };
    if (editingId) await firebaseData.from("announcements").update(payload).eq("id", editingId);
    else await firebaseData.from("announcements").insert(payload);
    setModalOpen(false); loadAll();
  };
  const deleteAnn = async (id: string) => { if (!confirm("Delete?")) return; await firebaseData.from("announcements").delete().eq("id", id); loadAll(); };

  // --- Stat CRUD ---
  const openStatModal = (s?: any) => {
    setEditingId(s?.id || null);
    setSfLabel(s?.label || ""); setSfValue(s?.value || ""); setSfSuffix(s?.suffix || "");
    setSfIcon(s?.icon || "Users"); setSfActive(s?.active !== false); setSfPriority(s?.priority || 0);
    setModalType("stat"); setModalOpen(true);
  };
  const saveStat = async () => {
    const payload = { label: sfLabel, value: sfValue, suffix: sfSuffix, icon: sfIcon, active: sfActive, priority: sfPriority };
    if (editingId) await firebaseData.from("stats").update(payload).eq("id", editingId);
    else await firebaseData.from("stats").insert(payload);
    setModalOpen(false); loadAll();
  };
  const deleteStat = async (id: string) => { if (!confirm("Delete stat?")) return; await firebaseData.from("stats").delete().eq("id", id); loadAll(); };

  // --- Setting inline edit ---
  const saveSetting = async (key: string, value: string) => {
    await firebaseData.from("settings").upsert({ key, value, type: "text" }, { onConflict: "key" });
    setEditSettingKey(null);
    loadAll();
  };

  if (authLoading) return <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-ink-950 flex items-center justify-center grain"><div className="text-center"><p className="text-ink-400 mb-4">Please login to access admin.</p><Link href="/auth" className="px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl">Login</Link></div></div>;
  if (!isAdmin) return <div className="min-h-screen bg-ink-950 flex items-center justify-center grain"><div className="text-center"><p className="text-red-400 mb-4">Unauthorized. Admin access only.</p><Link href="/" className="px-6 py-2.5 bg-ink-900 text-ink-300 text-sm font-semibold rounded-xl">Back Home</Link></div></div>;

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200 py-6 md:py-10 grain">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-ink-500 mt-1">Manage your entire store from one place.</p>
          </div>
          {!dbReady && (
            <button onClick={runSetup} disabled={setupRunning} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors">
              {setupRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {setupRunning ? "Initializing..." : "Initialize Firestore Database"}
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-ink-900/50 backdrop-blur rounded-2xl border border-ink-800 overflow-hidden">
              {adminTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${activeTab === tab.id ? "bg-brand-900/30 text-brand-400 font-semibold" : "text-ink-400 hover:bg-ink-800/50 hover:text-ink-200"}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Overview */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Products", value: products.length, change: "", up: true },
                      { label: "Categories", value: categories.length, change: "", up: true },
                      { label: "Announcements", value: announcements.length, change: "", up: true },
                      { label: "Messages", value: messages.length, change: "", up: true },
                    ].map((s) => (
                      <div key={s.label} className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-4">
                        <div className="text-xs text-ink-500 mb-1">{s.label}</div>
                        <div className="text-xl font-display font-bold text-white">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Products */}
              {activeTab === "products" && (
                <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Products ({products.length})</h2>
                    <button onClick={() => openProductModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> Add Product</button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 bg-ink-900 border border-ink-800 rounded-xl text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-600" />
                  </div>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-ink-800 text-left text-xs text-ink-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                        </tr></thead>
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
                              <td className="px-4 py-3 text-ink-400">{p.stockQuantity ?? 0}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5 flex-wrap">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.availability === 'in_stock' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{p.availability.replace('_',' ')}</span>
                                  {p.featured && <span className="text-[10px] bg-brand-900/40 text-brand-300 px-1.5 py-0.5 rounded">Featured</span>}
                                  {p.trending && <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">Trending</span>}
                                </div>
                              </td>
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

              {/* Categories */}
              {activeTab === "categories" && (
                <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Categories</h2>
                    <button onClick={() => openCategoryModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> Add</button>
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

              {/* Stats */}
              {activeTab === "stats" && (
                <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Site Stats</h2>
                    <button onClick={() => openStatModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> Add Stat</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.map((s) => (
                      <div key={s.id} className={`bg-ink-900/60 backdrop-blur border rounded-2xl p-4 flex items-center justify-between ${s.active ? 'border-ink-800' : 'border-red-900/30 opacity-60'}`}>
                        <div>
                          <div className="text-sm font-semibold text-ink-200">{s.label}</div>
                          <div className="text-xl font-display font-bold text-brand-300">{s.value}{s.suffix}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => openStatModal(s)} className="p-1.5 text-ink-400 hover:text-brand-400 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteStat(s.id)} className="p-1.5 text-ink-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CMS / Settings */}
              {activeTab === "cms" && (
                <motion.div key="cms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-white mb-4">CMS / Homepage Settings</h2>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl p-5 space-y-4">
                    {settings.map((set) => (
                      <div key={set.id} className="flex items-center gap-3 justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-ink-500 uppercase tracking-wider">{set.key.replace(/_/g, ' ')}</div>
                          {editSettingKey === set.key ? (
                            <div className="flex gap-2 mt-1">
                              <input value={editSettingValue} onChange={(e) => setEditSettingValue(e.target.value)} className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600" />
                              <button onClick={() => saveSetting(set.key, editSettingValue)} className="px-3 py-2 bg-brand-700 hover:bg-brand-600 rounded-lg text-white text-xs"><Save className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <div className="text-sm text-ink-200 mt-0.5">{set.value}</div>
                          )}
                        </div>
                        <button onClick={() => { setEditSettingKey(set.key); setEditSettingValue(set.value); }} className="p-1.5 text-ink-400 hover:text-brand-400 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {settings.length === 0 && <p className="text-sm text-ink-500">No settings found. Initialize database first.</p>}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {activeTab === "messages" && (
                <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="font-display text-xl font-bold text-white mb-4">Customer Messages</h2>
                  <div className="bg-ink-900/60 backdrop-blur border border-ink-800 rounded-2xl divide-y divide-ink-800/60">
                    {messages.length === 0 ? <div className="p-8 text-center text-ink-500 text-sm">No messages yet.</div> : messages.map((m) => (
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

              {/* Announcements */}
              {activeTab === "announcements" && (
                <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-white">Announcements</h2>
                    <button onClick={() => openAnnModal()} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> New</button>
                  </div>
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className={`bg-ink-900/60 backdrop-blur border rounded-2xl p-4 ${a.active ? "border-brand-800/50" : "border-ink-800"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-ink-200">{a.title}</div>
                          <div className="flex gap-2">
                            <button onClick={() => openAnnModal(a)} className="p-1.5 text-ink-400 hover:text-brand-400 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteAnn(a.id)} className="p-1.5 text-ink-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-ink-400 mb-2">{a.content}</p>
                        <div className="flex gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.active ? "bg-green-900/30 text-green-400" : "bg-ink-800 text-ink-500"}`}>{a.active ? "Active" : "Inactive"}</span>
                          <span className="text-[10px] bg-ink-800 text-ink-500 px-1.5 py-0.5 rounded capitalize">{a.type}</span>
                        </div>
                      </div>
                    ))}
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
                <h3 className="text-lg font-display font-bold text-white">{editingId ? "Edit" : "Add"} {modalType === "product" ? "Product" : modalType === "category" ? "Category" : modalType === "stat" ? "Stat" : "Announcement"}</h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 text-ink-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              {modalType === "product" && (
                <div className="space-y-3">
                  <input value={pfName} onChange={(e) => setPfName(e.target.value)} placeholder="Product Name" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={pfSlug} onChange={(e) => setPfSlug(e.target.value)} placeholder="Slug" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={pfShort} onChange={(e) => setPfShort(e.target.value)} placeholder="Short Description" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={pfFull} onChange={(e) => setPfFull(e.target.value)} placeholder="Full Description" rows={3} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={pfImage} onChange={(e) => setPfImage(e.target.value)} placeholder="Image URL" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={pfOrig} onChange={(e) => setPfOrig(Number(e.target.value))} placeholder="Original Price" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                    <input type="number" value={pfOffer ?? ""} onChange={(e) => setPfOffer(e.target.value ? Number(e.target.value) : undefined)} placeholder="Offer Price" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  </div>
                  <input value={pfTags} onChange={(e) => setPfTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={pfAvail} onChange={(e) => setPfAvail(e.target.value)} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600">
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre Order</option>
                    </select>
                    <input type="number" value={pfStock} onChange={(e) => setPfStock(Number(e.target.value))} placeholder="Stock Qty" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  </div>
                  <div className="flex gap-4 text-sm text-ink-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pfFeat} onChange={(e) => setPfFeat(e.target.checked)} /> Featured</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pfTrend} onChange={(e) => setPfTrend(e.target.checked)} /> Trending</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pfBest} onChange={(e) => setPfBest(e.target.checked)} /> Best Seller</label>
                  </div>
                  <button onClick={saveProduct} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Product</button>
                </div>
              )}

              {modalType === "category" && (
                <div className="space-y-3">
                  <input value={cfName} onChange={(e) => setCfName(e.target.value)} placeholder="Category Name" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={cfSlug} onChange={(e) => setCfSlug(e.target.value)} placeholder="Slug" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={cfImage} onChange={(e) => setCfImage(e.target.value)} placeholder="Image URL" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={cfDesc} onChange={(e) => setCfDesc(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <div className="flex gap-4 text-sm text-ink-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cfFeat} onChange={(e) => setCfFeat(e.target.checked)} /> Featured</label>
                    <input type="number" value={cfPriority} onChange={(e) => setCfPriority(Number(e.target.value))} placeholder="Priority" className="w-20 px-2 py-1 bg-ink-950 border border-ink-800 rounded text-sm text-white" />
                  </div>
                  <button onClick={saveCategory} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Category</button>
                </div>
              )}

              {modalType === "stat" && (
                <div className="space-y-3">
                  <input value={sfLabel} onChange={(e) => setSfLabel(e.target.value)} placeholder="Label (e.g. Happy Customers)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={sfValue} onChange={(e) => setSfValue(e.target.value)} placeholder="Value (e.g. 15420)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <input value={sfSuffix} onChange={(e) => setSfSuffix(e.target.value)} placeholder="Suffix (e.g. +)" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <select value={sfIcon} onChange={(e) => setSfIcon(e.target.value)} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600">
                    <option value="Users">Users</option>
                    <option value="ShoppingCart">ShoppingCart</option>
                    <option value="Package">Package</option>
                    <option value="Star">Star</option>
                    <option value="TrendingUp">TrendingUp</option>
                    <option value="Award">Award</option>
                  </select>
                  <div className="flex gap-4 text-sm text-ink-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={sfActive} onChange={(e) => setSfActive(e.target.checked)} /> Active</label>
                    <input type="number" value={sfPriority} onChange={(e) => setSfPriority(Number(e.target.value))} placeholder="Priority" className="w-20 px-2 py-1 bg-ink-950 border border-ink-800 rounded text-sm text-white" />
                  </div>
                  <button onClick={saveStat} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Stat</button>
                </div>
              )}

              {modalType === "announcement" && (
                <div className="space-y-3">
                  <input value={afTitle} onChange={(e) => setAfTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <textarea value={afContent} onChange={(e) => setAfContent(e.target.value)} placeholder="Content" rows={2} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  <select value={afType} onChange={(e) => setAfType(e.target.value)} className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white outline-none focus:border-brand-600">
                    <option value="bar">Top Bar</option>
                    <option value="banner">Banner</option>
                    <option value="popup">Popup</option>
                  </select>
                  <div className="flex gap-3">
                    <input value={afCtaText} onChange={(e) => setAfCtaText(e.target.value)} placeholder="CTA Text" className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                    <input value={afCtaLink} onChange={(e) => setAfCtaLink(e.target.value)} placeholder="CTA Link" className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sm text-white placeholder:text-ink-600 outline-none focus:border-brand-600" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-300"><input type="checkbox" checked={afActive} onChange={(e) => setAfActive(e.target.checked)} /> Active</label>
                  <button onClick={saveAnn} className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors">Save Announcement</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
