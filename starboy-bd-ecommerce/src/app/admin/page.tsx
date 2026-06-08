"use client";

/**
 * Admin Panel — single-page dashboard for STARBOY BD.
 *
 * Performance / low-resource notes:
 *  - Data for each tab is fetched ONLY when that tab is first opened (lazy) and
 *    cached in state, so opening the admin panel does not hammer Firestore.
 *  - No realtime listeners or polling — everything is on-demand with a manual
 *    "Refresh" so an idle admin tab costs nothing.
 *  - Admin route is gated client-side; combine with Firestore security rules.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, Package, Tags, Settings, BarChart3, ShoppingCart,
  MessageCircle, Star, Megaphone, Database, RefreshCcw, Plus, Trash2,
  Pencil, X, Save, LogOut, AlertTriangle, Users, Quote,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firebaseData } from "@/lib/firebaseData";
import {
  initializeFirebaseDatabase,
  resetFirebaseDatabase,
} from "@/lib/firestoreSeed";
import { formatPrice } from "@/lib/utils";
import type {
  Product, Category, SiteSetting, SiteStat, Announcement, Review,
  ChatMessage, UserProfile, Testimonial,
} from "@/types";
import toast from "react-hot-toast";

type Tab =
  | "overview" | "products" | "categories" | "settings" | "stats"
  | "announcements" | "orders" | "messages" | "reviews" | "testimonials" | "users";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "testimonials", label: "Testimonials", icon: Quote },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "users", label: "Users", icon: Users },
];

const inputCls =
  "w-full px-3 py-2 bg-ink-50 border border-ink-200 rounded-lg text-sm outline-none focus:border-brand-500 transition-colors";
const labelCls = "text-xs font-semibold text-ink-600 mb-1 block";

export default function AdminPage() {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl border border-ink-100 shadow-soft p-8 max-w-sm">
          <AlertTriangle className="w-10 h-10 text-brand-600 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-ink-950 mb-1">
            Admin access only
          </h1>
          <p className="text-sm text-ink-500 mb-5">
            You need an administrator account to view this page.
          </p>
          <Link
            href={user ? "/dashboard" : "/auth"}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors"
          >
            {user ? "Go to Dashboard" : "Login"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-950">
              Admin Panel
            </h1>
            <p className="text-xs text-ink-500">Signed in as {user.username}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-6 bg-white rounded-xl border border-ink-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-ink-950 text-brand-300"
                  : "text-ink-600 hover:bg-brand-50"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab onNavigate={setTab} />}
        {tab === "products" && <ProductsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "testimonials" && <TestimonialsTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Shared UI bits                                                      */
/* ================================================================== */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 md:p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  title, count, onRefresh, action,
}: {
  title: string; count?: number; onRefresh?: () => void; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-lg font-bold text-ink-950">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 text-sm font-normal text-ink-400">({count})</span>
        )}
      </h2>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-ink-500 hover:text-brand-700 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-500 text-center py-10">{text}</p>;
}

/* Generic lazy-loading hook for a Firestore collection. */
function useCollection<T = any>(
  loader: () => PromiseLike<{ data: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows } = await loader();
      setData((rows as T[]) || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, loading, refresh };
}

/* ================================================================== */
/* Overview + Database tools                                           */
/* ================================================================== */

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cols = ["products", "categories", "orders", "messages", "reviews", "users"];
      const results = await Promise.all(
        cols.map((c) => firebaseData.from(c).select("*"))
      );
      const next: Record<string, number> = {};
      cols.forEach((c, i) => (next[c] = (results[i].data || []).length));
      setCounts(next);
    } catch {
      toast.error("Could not load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seed = async () => {
    if (!confirm("Initialize the database with demo products, categories, settings and stats? Existing demo collections will be replaced.")) return;
    setSeeding(true);
    try {
      await initializeFirebaseDatabase();
      toast.success("Database initialized with demo data");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Initialization failed");
    } finally {
      setSeeding(false);
    }
  };

  const reset = async () => {
    if (!confirm("DELETE ALL DATA from every collection? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? This wipes products, orders, users, everything.")) return;
    setSeeding(true);
    try {
      await resetFirebaseDatabase();
      toast.success("Database reset complete");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Reset failed");
    } finally {
      setSeeding(false);
    }
  };

  const cards = [
    { key: "products", label: "Products", icon: Package, tab: "products" as Tab },
    { key: "categories", label: "Categories", icon: Tags, tab: "categories" as Tab },
    { key: "orders", label: "Orders", icon: ShoppingCart, tab: "orders" as Tab },
    { key: "messages", label: "Messages", icon: MessageCircle, tab: "messages" as Tab },
    { key: "reviews", label: "Reviews", icon: Star, tab: "reviews" as Tab },
    { key: "users", label: "Users", icon: Users, tab: "users" as Tab },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => onNavigate(c.tab)}
            className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 text-left hover:shadow-premium transition-shadow"
          >
            <c.icon className="w-5 h-5 text-brand-600 mb-2" />
            <div className="text-2xl font-bold text-ink-950">
              {loading ? "—" : counts[c.key] ?? 0}
            </div>
            <div className="text-xs text-ink-500">{c.label}</div>
          </button>
        ))}
      </div>

      <Panel>
        <SectionHeader title="Database Tools" onRefresh={load} />
        <p className="text-sm text-ink-500 mb-4">
          Use these once when setting up the store. Seeding adds demo products,
          categories, settings and stats so the storefront isn&apos;t empty.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={seed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors disabled:opacity-60"
          >
            <Database className="w-4 h-4" />
            {seeding ? "Working…" : "Initialize / Seed Database"}
          </button>
          <button
            onClick={reset}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" /> Reset (wipe everything)
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* ================================================================== */
/* Products                                                           */
/* ================================================================== */

const blankProduct: Partial<Product> = {
  name: "", slug: "", shortDescription: "", fullDescription: "",
  images: [], originalPrice: 0, offerPrice: undefined, categories: [],
  categoryNames: [], tags: [], availability: "in_stock", featured: false,
  trending: false, bestSeller: false, stockQuantity: 0, availableSizes: [],
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ProductsTab() {
  const { data, loading, refresh } = useCollection<Product>(
    () => firebaseData.from("products").select("*").order("createdAt", { ascending: false })
  );
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const save = async (p: Partial<Product>) => {
    if (!p.name?.trim()) return toast.error("Name is required");
    const payload: any = {
      ...p,
      slug: p.slug?.trim() || slugify(p.name),
      originalPrice: Number(p.originalPrice) || 0,
      offerPrice: p.offerPrice ? Number(p.offerPrice) : undefined,
      stockQuantity: Number(p.stockQuantity) || 0,
      images: (p.images || []).filter(Boolean),
      tags: p.tags || [],
      categories: p.categories || [],
      categoryNames: p.categoryNames || [],
      availableSizes: p.availableSizes || [],
    };
    try {
      if (p.id) {
        await firebaseData.from("products").update(payload).eq("id", p.id);
        toast.success("Product updated");
      } else {
        await firebaseData.from("products").insert(payload);
        toast.success("Product added");
      }
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await firebaseData.from("products").delete().eq("id", id);
      toast.success("Deleted");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  return (
    <Panel>
      <SectionHeader
        title="Products"
        count={data.length}
        onRefresh={refresh}
        action={
          <button
            onClick={() => setEditing({ ...blankProduct })}
            className="flex items-center gap-1.5 px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        }
      />
      {loading ? (
        <Spinner />
      ) : data.length === 0 ? (
        <Empty text="No products yet. Seed the database or add one." />
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 bg-surface rounded-xl"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{p.name}</div>
                <div className="text-xs text-ink-500">
                  {formatPrice(p.offerPrice ?? p.originalPrice)} · Stock {p.stockQuantity} · {p.availability}
                </div>
              </div>
              <button onClick={() => setEditing(p)} className="p-2 text-ink-500 hover:text-brand-700">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(p.id)} className="p-2 text-ink-500 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </Panel>
  );
}

function ProductEditor({
  product, onClose, onSave,
}: {
  product: Partial<Product>;
  onClose: () => void;
  onSave: (p: Partial<Product>) => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(product);
  const set = (k: keyof Product, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[90] bg-ink-950/60 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-ink-100">
          <h3 className="font-display text-lg font-bold text-ink-950">
            {form.id ? "Edit Product" : "New Product"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-ink-500 hover:text-ink-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Slug (auto from name if blank)</label>
            <input className={inputCls} value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder={form.name ? slugify(form.name) : ""} />
          </div>
          <div>
            <label className={labelCls}>Short description</label>
            <input className={inputCls} value={form.shortDescription || ""} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Full description</label>
            <textarea rows={3} className={inputCls + " resize-none"} value={form.fullDescription || ""} onChange={(e) => set("fullDescription", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Image URLs (one per line)</label>
            <textarea rows={2} className={inputCls + " resize-none"} value={(form.images || []).join("\n")} onChange={(e) => set("images", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Original price (৳)</label>
              <input type="number" className={inputCls} value={form.originalPrice ?? 0} onChange={(e) => set("originalPrice", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Offer price (৳)</label>
              <input type="number" className={inputCls} value={form.offerPrice ?? ""} onChange={(e) => set("offerPrice", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stock quantity</label>
              <input type="number" className={inputCls} value={form.stockQuantity ?? 0} onChange={(e) => set("stockQuantity", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Availability</label>
              <select className={inputCls} value={form.availability || "in_stock"} onChange={(e) => set("availability", e.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="pre_order">Pre-order</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input className={inputCls} value={(form.tags || []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className={labelCls}>Category names (comma separated)</label>
            <input className={inputCls} value={(form.categoryNames || []).join(", ")} onChange={(e) => set("categoryNames", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className={labelCls}>Available Sizes</label>
            <div className="flex flex-wrap gap-3 pt-1">
              {["M", "L", "XL", "XXL"].map((size) => (
                <label key={size} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={(form.availableSizes || []).includes(size)}
                    onChange={(e) => {
                      const current = form.availableSizes || [];
                      const next = e.target.checked
                        ? [...current, size]
                        : current.filter((s) => s !== size);
                      set("availableSizes", next);
                    }}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            {(["featured", "trending", "bestSeller"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={!!form[flag]} onChange={(e) => set(flag, e.target.checked)} />
                {flag}
              </label>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white flex gap-2 p-4 border-t border-ink-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-ink-200 text-ink-700 text-sm font-semibold rounded-xl hover:bg-ink-50">
            Cancel
          </button>
          <button onClick={() => onSave(form)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Categories                                                         */
/* ================================================================== */

function CategoriesTab() {
  const { data, loading, refresh } = useCollection<Category>(
    () => firebaseData.from("categories").select("*").order("priority")
  );
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const save = async (c: Partial<Category>) => {
    if (!c.name?.trim()) return toast.error("Name required");
    const payload: any = {
      ...c,
      slug: c.slug?.trim() || slugify(c.name),
      priority: Number(c.priority) || 0,
      featured: !!c.featured,
    };
    try {
      if (c.id) await firebaseData.from("categories").update(payload).eq("id", c.id);
      else await firebaseData.from("categories").insert(payload);
      toast.success("Saved");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await firebaseData.from("categories").delete().eq("id", id);
    toast.success("Deleted");
    refresh();
  };

  return (
    <Panel>
      <SectionHeader
        title="Categories" count={data.length} onRefresh={refresh}
        action={
          <button onClick={() => setEditing({ name: "", slug: "", image: "", priority: 0, featured: true })} className="flex items-center gap-1.5 px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        }
      />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No categories yet." /> : (
        <div className="space-y-2">
          {data.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-cover bg-center bg-ink-100 flex-shrink-0" style={{ backgroundImage: c.image ? `url(${c.image})` : undefined }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{c.name}</div>
                <div className="text-xs text-ink-500">/{c.slug} · priority {c.priority}{c.featured ? " · featured" : ""}</div>
              </div>
              <button onClick={() => setEditing(c)} className="p-2 text-ink-500 hover:text-brand-700"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(c.id)} className="p-2 text-ink-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SimpleEditor
          title={editing.id ? "Edit Category" : "New Category"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
          fields={
            <>
              <Field label="Name" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Slug (auto if blank)" value={editing.slug || ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Field label="Image URL" value={editing.image || ""} onChange={(v) => setEditing({ ...editing, image: v })} />
              <Field label="Description" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <Field label="Priority" type="number" value={String(editing.priority ?? 0)} onChange={(v) => setEditing({ ...editing, priority: Number(v) })} />
              <Check label="Featured" checked={!!editing.featured} onChange={(v) => setEditing({ ...editing, featured: v })} />
            </>
          }
        />
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Announcements                                                      */
/* ================================================================== */

function AnnouncementsTab() {
  const { data, loading, refresh } = useCollection<Announcement>(
    () => firebaseData.from("announcements").select("*").order("priority")
  );
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);

  const save = async (a: Partial<Announcement>) => {
    const payload: any = {
      ...a,
      priority: Number(a.priority) || 0,
      active: !!a.active,
      type: a.type || "bar",
    };
    if (a.id) await firebaseData.from("announcements").update(payload).eq("id", a.id);
    else await firebaseData.from("announcements").insert(payload);
    toast.success("Saved");
    setEditing(null);
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await firebaseData.from("announcements").delete().eq("id", id);
    refresh();
  };

  return (
    <Panel>
      <SectionHeader
        title="Announcements" count={data.length} onRefresh={refresh}
        action={
          <button onClick={() => setEditing({ title: "", content: "", type: "bar", active: true, priority: 1 })} className="flex items-center gap-1.5 px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        }
      />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No announcements." /> : (
        <div className="space-y-2">
          {data.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{a.content}</div>
                <div className="text-xs text-ink-500">{a.type} · {a.active ? "active" : "inactive"} · priority {a.priority}</div>
              </div>
              <button onClick={() => setEditing(a)} className="p-2 text-ink-500 hover:text-brand-700"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(a.id)} className="p-2 text-ink-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <SimpleEditor
          title={editing.id ? "Edit Announcement" : "New Announcement"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
          fields={
            <>
              <Field label="Title" value={editing.title || ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Content (shown in bar)" value={editing.content || ""} onChange={(v) => setEditing({ ...editing, content: v })} />
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={editing.type || "bar"} onChange={(e) => setEditing({ ...editing, type: e.target.value as Announcement["type"] })}>
                  <option value="bar">Bar</option>
                  <option value="banner">Banner</option>
                  <option value="popup">Popup</option>
                </select>
              </div>
              <Field label="Priority" type="number" value={String(editing.priority ?? 1)} onChange={(v) => setEditing({ ...editing, priority: Number(v) })} />
              <Check label="Active" checked={!!editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
            </>
          }
        />
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Stats                                                              */
/* ================================================================== */

function StatsTab() {
  const { data, loading, refresh } = useCollection<SiteStat>(
    () => firebaseData.from("stats").select("*").order("priority")
  );
  const [editing, setEditing] = useState<Partial<SiteStat> | null>(null);

  const save = async (s: Partial<SiteStat>) => {
    const payload: any = { ...s, priority: Number(s.priority) || 0, active: !!s.active };
    if (s.id) await firebaseData.from("stats").update(payload).eq("id", s.id);
    else await firebaseData.from("stats").insert(payload);
    toast.success("Saved");
    setEditing(null);
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await firebaseData.from("stats").delete().eq("id", id);
    refresh();
  };

  return (
    <Panel>
      <SectionHeader
        title="Stats" count={data.length} onRefresh={refresh}
        action={
          <button onClick={() => setEditing({ label: "", value: "", suffix: "+", icon: "Users", active: true, priority: 1 })} className="flex items-center gap-1.5 px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        }
      />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No stats." /> : (
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900">{s.value}{s.suffix} — {s.label}</div>
                <div className="text-xs text-ink-500">{s.icon} · {s.active ? "active" : "inactive"}</div>
              </div>
              <button onClick={() => setEditing(s)} className="p-2 text-ink-500 hover:text-brand-700"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(s.id)} className="p-2 text-ink-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <SimpleEditor
          title={editing.id ? "Edit Stat" : "New Stat"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
          fields={
            <>
              <Field label="Label" value={editing.label || ""} onChange={(v) => setEditing({ ...editing, label: v })} />
              <Field label="Value" value={editing.value || ""} onChange={(v) => setEditing({ ...editing, value: v })} />
              <Field label="Suffix" value={editing.suffix || ""} onChange={(v) => setEditing({ ...editing, suffix: v })} />
              <Field label="Icon (lucide name, e.g. Users)" value={editing.icon || ""} onChange={(v) => setEditing({ ...editing, icon: v })} />
              <Field label="Priority" type="number" value={String(editing.priority ?? 1)} onChange={(v) => setEditing({ ...editing, priority: Number(v) })} />
              <Check label="Active" checked={!!editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
            </>
          }
        />
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Settings (key/value)                                               */
/* ================================================================== */

function SettingsTab() {
  const { data, loading, refresh } = useCollection<SiteSetting>(
    () => firebaseData.from("settings").select("*")
  );
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const d: Record<string, string> = {};
    data.forEach((s) => (d[s.id] = s.value));
    setDraft(d);
  }, [data]);

  const saveOne = async (s: SiteSetting) => {
    try {
      await firebaseData.from("settings").update({ value: draft[s.id] ?? s.value }).eq("id", s.id);
      toast.success(`Saved ${s.key}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  return (
    <Panel>
      <SectionHeader title="Site Settings" count={data.length} onRefresh={refresh} />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No settings. Seed the database first." /> : (
        <div className="space-y-3">
          {data.map((s) => (
            <div key={s.id} className="p-3 bg-surface rounded-xl">
              <label className={labelCls}>{s.key}</label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={draft[s.id] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                />
                <button onClick={() => saveOne(s)} className="px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors">
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Orders                                                             */
/* ================================================================== */

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function OrdersTab() {
  const { data, loading, refresh } = useCollection<any>(
    () => firebaseData.from("orders").select("*").order("createdAt", { ascending: false })
  );

  const setStatus = async (id: string, status: string) => {
    try {
      await firebaseData.from("orders").update({ status }).eq("id", id);
      toast.success("Order updated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  return (
    <Panel>
      <SectionHeader title="Orders" count={data.length} onRefresh={refresh} />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No orders yet." /> : (
        <div className="space-y-2">
          {data.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-3 bg-surface rounded-xl">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900">Order #{String(o.id).slice(0, 8)}</div>
                <div className="text-xs text-ink-500">
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"} · {formatPrice(o.total || 0)}
                </div>
              </div>
              <select
                value={o.status || "pending"}
                onChange={(e) => setStatus(o.id, e.target.value)}
                className="px-2 py-1.5 bg-white border border-ink-200 rounded-lg text-xs capitalize outline-none focus:border-brand-500"
              >
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Messages (product chat)                                            */
/* ================================================================== */

function MessagesTab() {
  const { data, loading, refresh } = useCollection<ChatMessage>(
    () => firebaseData.from("chat_messages").select("*").order("createdAt", { ascending: false })
  );
  const [reply, setReply] = useState<Record<string, string>>({});

  const send = async (m: ChatMessage) => {
    const text = (reply[m.id] || "").trim();
    if (!text) return;
    try {
      await firebaseData.from("chat_messages").insert({
        productId: m.productId,
        productName: m.productName,
        userId: m.userId,
        userName: "Admin",
        text,
        sender: "admin",
        read: true,
        createdAt: new Date().toISOString(),
      });
      await firebaseData.from("chat_messages").update({ read: true }).eq("id", m.id);
      setReply((r) => ({ ...r, [m.id]: "" }));
      toast.success("Reply sent");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  return (
    <Panel>
      <SectionHeader title="Customer Messages" count={data.length} onRefresh={refresh} />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No messages." /> : (
        <div className="space-y-2">
          {data.map((m) => (
            <div key={m.id} className={`p-3 rounded-xl ${m.sender === "admin" ? "bg-brand-50" : "bg-surface"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink-800">
                  {m.userName} {m.sender === "admin" && "(Admin)"} · {m.productName}
                </span>
                <span className="text-[10px] text-ink-400">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <p className="text-sm text-ink-700">{m.text}</p>
              {m.sender === "user" && (
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 px-3 py-1.5 bg-white border border-ink-200 rounded-lg text-xs outline-none focus:border-brand-500"
                    placeholder="Reply…"
                    value={reply[m.id] || ""}
                    onChange={(e) => setReply((r) => ({ ...r, [m.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && send(m)}
                  />
                  <button onClick={() => send(m)} className="px-3 py-1.5 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors">
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Reviews                                                            */
/* ================================================================== */

function ReviewsTab() {
  const { data, loading, refresh } = useCollection<Review>(
    () => firebaseData.from("reviews").select("*").order("createdAt", { ascending: false })
  );

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await firebaseData.from("reviews").delete().eq("id", id);
    toast.success("Deleted");
    refresh();
  };

  return (
    <Panel>
      <SectionHeader title="Reviews" count={data.length} onRefresh={refresh} />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No reviews." /> : (
        <div className="space-y-2">
          {data.map((r) => (
            <div key={r.id} className="p-3 bg-surface rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink-800">
                  {r.userName} · {"★".repeat(Math.max(0, Math.min(5, r.rating)))}
                </span>
                <button onClick={() => remove(r.id)} className="p-1.5 text-ink-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-ink-700">{r.comment}</p>
              {r.replies?.length > 0 && (
                <p className="text-[10px] text-ink-400 mt-1">{r.replies.length} repl{r.replies.length === 1 ? "y" : "ies"}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Users                                                              */
/* ================================================================== */

function UsersTab() {
  const { data, loading, refresh } = useCollection<UserProfile>(
    () => firebaseData.from("users").select("*").order("createdAt", { ascending: false })
  );

  const toggleRole = async (u: UserProfile) => {
    const role = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Make ${u.username} ${role === "admin" ? "an admin" : "a regular user"}?`)) return;
    await firebaseData.from("users").update({ role }).eq("id", u.id);
    toast.success("Role updated");
    refresh();
  };

  return (
    <Panel>
      <SectionHeader title="Users" count={data.length} onRefresh={refresh} />
      {loading ? <Spinner /> : data.length === 0 ? <Empty text="No users yet." /> : (
        <div className="space-y-2">
          {data.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {u.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{u.username}</div>
                <div className="text-xs text-ink-500 truncate">{u.phone}{u.email ? ` · ${u.email}` : ""}</div>
              </div>
              <button
                onClick={() => toggleRole(u)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${u.role === "admin" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-brand-50"}`}
              >
                {u.role}
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Testimonials                                                       */
/* ================================================================== */

function TestimonialsTab() {
  const { data, loading, refresh } = useCollection<Testimonial>(
    () => firebaseData.from("testimonials").select("*").order("createdAt", { ascending: false })
  );
  // Load products so admin can associate a testimonial with a product by name.
  const { data: products } = useCollection<Product>(
    () => firebaseData.from("products").select("*").order("createdAt", { ascending: false })
  );
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);

  const save = async (t: Partial<Testimonial>) => {
    if (!t.customerName?.trim()) return toast.error("Customer name is required");
    if (!t.description?.trim()) return toast.error("Testimonial text is required");
    // Resolve product name from the selected product id.
    const linked = products.find((p) => p.id === t.productId);
    const payload: any = {
      customerName: t.customerName.trim(),
      customerImage: t.customerImage?.trim() || "",
      description: t.description.trim(),
      productId: t.productId || "",
      productName: linked?.name || t.productName || "",
      active: t.active !== false,
      likes: t.likes || [],
      comments: t.comments || [],
    };
    try {
      if (t.id) await firebaseData.from("testimonials").update(payload).eq("id", t.id);
      else await firebaseData.from("testimonials").insert(payload);
      toast.success("Saved");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await firebaseData.from("testimonials").delete().eq("id", id);
    toast.success("Deleted");
    refresh();
  };

  return (
    <Panel>
      <SectionHeader
        title="Testimonials"
        count={data.length}
        onRefresh={refresh}
        action={
          <button
            onClick={() => setEditing({ customerName: "", customerImage: "", description: "", productId: "", active: true, likes: [], comments: [] })}
            className="flex items-center gap-1.5 px-3 py-2 bg-ink-950 text-brand-300 text-xs font-semibold rounded-lg hover:bg-brand-700 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        }
      />
      {loading ? (
        <Spinner />
      ) : data.length === 0 ? (
        <Empty text="No testimonials yet. Add one with the button above." />
      ) : (
        <div className="space-y-2">
          {data.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-ink-100 flex-shrink-0">
                {t.customerImage ? (
                  <Image src={t.customerImage} alt={t.customerName} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-500 text-sm font-bold">
                    {t.customerName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{t.customerName}</div>
                <div className="text-xs text-ink-500 truncate">
                  {t.productName ? `For: ${t.productName}` : "No product linked"}{t.active === false ? " · hidden" : ""}
                </div>
              </div>
              <button onClick={() => setEditing(t)} className="p-2 text-ink-500 hover:text-brand-700"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(t.id)} className="p-2 text-ink-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SimpleEditor
          title={editing.id ? "Edit Testimonial" : "New Testimonial"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
          fields={
            <>
              <Field label="Customer name" value={editing.customerName || ""} onChange={(v) => setEditing({ ...editing, customerName: v })} />
              <Field label="Customer image URL (optional)" value={editing.customerImage || ""} onChange={(v) => setEditing({ ...editing, customerImage: v })} />
              <div>
                <label className={labelCls}>Related product</label>
                <select
                  className={inputCls}
                  value={editing.productId || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const linked = products.find((p) => p.id === id);
                    setEditing({ ...editing, productId: id, productName: linked?.name || "" });
                  }}
                >
                  <option value="">— No product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Testimonial</label>
                <textarea
                  rows={3}
                  className={inputCls + " resize-none"}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What did the customer say?"
                />
              </div>
              <Check label="Active (visible on site)" checked={editing.active !== false} onChange={(v) => setEditing({ ...editing, active: v })} />
            </>
          }
        />
      )}
    </Panel>
  );
}

/* ================================================================== */
/* Small reusable editor + field controls                             */
/* ================================================================== */

function SimpleEditor({
  title, fields, onClose, onSave,
}: {
  title: string;
  fields: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-ink-950/60 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-ink-100">
          <h3 className="font-display text-lg font-bold text-ink-950">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-ink-500 hover:text-ink-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">{fields}</div>
        <div className="sticky bottom-0 bg-white flex gap-2 p-4 border-t border-ink-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-ink-200 text-ink-700 text-sm font-semibold rounded-xl hover:bg-ink-50">Cancel</button>
          <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ink-950 text-brand-300 text-sm font-semibold rounded-xl hover:bg-brand-700 hover:text-white transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Check({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
