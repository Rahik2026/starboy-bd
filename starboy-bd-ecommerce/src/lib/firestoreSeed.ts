"use client";

import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const now = () => new Date().toISOString();

const categories = [
  {
    id: "urban-street",
    name: "Urban Street",
    slug: "urban-street",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800",
    description: "Contemporary street style essentials for the modern man.",
    featured: true,
    priority: 1,
  },
  {
    id: "premium-shirts",
    name: "Premium Shirts",
    slug: "premium-shirts",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800",
    description: "Handcrafted shirts with premium fabrics and perfect fits.",
    featured: true,
    priority: 2,
  },
  {
    id: "leather-goods",
    name: "Leather Goods",
    slug: "leather-goods",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800",
    description: "Genuine leather belts, wallets, and accessories.",
    featured: true,
    priority: 3,
  },
];

const products = [
  {
    id: "pink-poplin-shirt",
    name: "Pink Poplin Shirt",
    slug: "pink-poplin-shirt",
    shortDescription: "Premium pink poplin cotton shirt with tailored fit.",
    fullDescription: "Crafted from 100% Egyptian cotton poplin, this shirt features a tailored modern fit, spread collar, and genuine mother-of-pearl buttons.",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200"],
    originalPrice: 2800,
    offerPrice: 2200,
    categories: ["premium-shirts"],
    tags: ["shirt", "cotton", "formal"],
    availability: "in_stock",
    featured: true,
    trending: false,
    bestSeller: true,
    stockQuantity: 50,
    specs: { Fabric: "Egyptian Cotton", Fit: "Tailored" },
  },
  {
    id: "ms-light-blue-oxford",
    name: "M&S Light Blue Oxford",
    slug: "ms-light-blue-oxford",
    shortDescription: "Classic light blue oxford shirt with modern silhouette.",
    fullDescription: "The timeless Oxford shirt reimagined for the modern wardrobe. Features a button-down collar, chest pocket, and durable yet soft cotton weave.",
    images: ["https://images.unsplash.com/photo-1598032895397-b9472444bf93?q=80&w=1200"],
    originalPrice: 2600,
    offerPrice: null,
    categories: ["premium-shirts"],
    tags: ["shirt", "oxford", "classic"],
    availability: "in_stock",
    featured: true,
    trending: true,
    bestSeller: false,
    stockQuantity: 30,
    specs: { Fabric: "Oxford Cotton", Fit: "Regular" },
  },
  {
    id: "charcoal-premium-shirt",
    name: "Charcoal Premium Shirt",
    slug: "charcoal-premium-shirt",
    shortDescription: "Dark charcoal premium shirt with micro-texture.",
    fullDescription: "A statement piece in deep charcoal with subtle micro-texture. Features a slim fit, French placket, and curved hem.",
    images: ["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200"],
    originalPrice: 3200,
    offerPrice: 2700,
    categories: ["premium-shirts"],
    tags: ["shirt", "charcoal", "slim"],
    availability: "in_stock",
    featured: true,
    trending: false,
    bestSeller: false,
    stockQuantity: 20,
    specs: { Fabric: "Premium Blend", Fit: "Slim" },
  },
  {
    id: "ms-poplin-check-shirt",
    name: "M&S Poplin Check Shirt",
    slug: "ms-poplin-check-shirt",
    shortDescription: "Refined check pattern poplin shirt for everyday elegance.",
    fullDescription: "Balancing tradition with contemporary style, this check poplin shirt offers breathability and a crisp finish.",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200"],
    originalPrice: 2500,
    offerPrice: null,
    categories: ["premium-shirts"],
    tags: ["shirt", "check", "poplin"],
    availability: "in_stock",
    featured: false,
    trending: true,
    bestSeller: true,
    stockQuantity: 40,
    specs: { Fabric: "Poplin", Pattern: "Check" },
  },
  {
    id: "urban-street-hoodie",
    name: "Urban Street Hoodie",
    slug: "urban-street-hoodie",
    shortDescription: "Heavyweight cotton hoodie with structured fit.",
    fullDescription: "Built for the streets. This heavyweight cotton hoodie features a structured oversized fit, double-layered hood, and premium ribbed cuffs.",
    images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200"],
    originalPrice: 3800,
    offerPrice: 3200,
    categories: ["urban-street"],
    tags: ["hoodie", "street", "casual"],
    availability: "in_stock",
    featured: true,
    trending: true,
    bestSeller: true,
    stockQuantity: 25,
    specs: { Fabric: "Heavy Cotton", Weight: "450 GSM" },
  },
  {
    id: "leather-signature-belt",
    name: "Leather Signature Belt",
    slug: "leather-signature-belt",
    shortDescription: "Full-grain leather belt with brushed brass buckle.",
    fullDescription: "Handcrafted from full-grain vegetable-tanned leather. Features a minimal brushed brass buckle and refined stitching.",
    images: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1200"],
    originalPrice: 1800,
    offerPrice: null,
    categories: ["leather-goods"],
    tags: ["belt", "leather", "accessory"],
    availability: "in_stock",
    featured: true,
    trending: false,
    bestSeller: false,
    stockQuantity: 60,
    specs: { Leather: "Full Grain", Buckle: "Brass" },
  },
  {
    id: "classic-aviators",
    name: "Classic Aviators",
    slug: "classic-aviators",
    shortDescription: "Polarized aviator sunglasses with gold frames.",
    fullDescription: "Timeless aviator silhouette with 24k gold-plated stainless steel frames and polarized lenses.",
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1200"],
    originalPrice: 2400,
    offerPrice: 1900,
    categories: ["leather-goods"],
    tags: ["sunglasses", "aviator", "gold"],
    availability: "in_stock",
    featured: false,
    trending: true,
    bestSeller: true,
    stockQuantity: 15,
    specs: { Frame: "Stainless Steel", Lenses: "Polarized" },
  },
  {
    id: "structured-street-cap",
    name: "Structured Street Cap",
    slug: "structured-street-cap",
    shortDescription: "Minimal structured cap with embroidered logo.",
    fullDescription: "Six-panel structured cap in premium cotton twill. Features subtle embroidered branding, adjustable leather strap closure, and reinforced eyelets.",
    images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200"],
    originalPrice: 1200,
    offerPrice: null,
    categories: ["urban-street"],
    tags: ["cap", "street", "minimal"],
    availability: "in_stock",
    featured: false,
    trending: false,
    bestSeller: false,
    stockQuantity: 100,
    specs: { Panels: "6", Fabric: "Cotton Twill" },
  },
];

const announcements = [
  {
    id: "free-delivery",
    title: "Free Delivery",
    content: "FREE DELIVERY ON ORDERS OVER 5,000 BDT | 100% SECURE PAYMENTS",
    type: "bar",
    active: true,
    priority: 1,
  },
];

const stats = [
  { id: "happy-customers", label: "Happy Customers", value: "15420", suffix: "+", icon: "Users", active: true, priority: 1 },
  { id: "products-sold", label: "Products Sold", value: "89300", suffix: "+", icon: "ShoppingCart", active: true, priority: 2 },
  { id: "premium-products", label: "Premium Products", value: "500", suffix: "+", icon: "Package", active: true, priority: 3 },
  { id: "avg-rating", label: "Avg. Rating", value: "4.9", suffix: "/5", icon: "Star", active: true, priority: 4 },
];

const settings = [
  { id: "hero_title", key: "hero_title", value: "THE MODERN STANDARD.", type: "text" },
  { id: "hero_subtitle", key: "hero_subtitle", value: "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.", type: "text" },
  { id: "hero_cta_primary", key: "hero_cta_primary", value: "Shop New Arrivals", type: "text" },
  { id: "hero_cta_secondary", key: "hero_cta_secondary", value: "Explore Collections", type: "text" },
  { id: "footer_outlet_text", key: "footer_outlet_text", value: "You are welcome to our outlet", type: "text" },
  { id: "footer_outlet_location", key: "footer_outlet_location", value: "Korim mes, College road, Satkhira", type: "text" },
];

async function setIfMissing(collectionName: string, id: string, data: Record<string, any>) {
  if (!db) throw new Error("Firebase Firestore is not initialized");

  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      createdAt: data.createdAt || now(),
      updatedAt: now(),
    });
  }
}

export async function initializeFirebaseDatabase() {
  if (!db) throw new Error("Firebase Firestore is not initialized");

  await Promise.all([
    ...categories.map((item) => setIfMissing("categories", item.id, item)),
    ...products.map((item) => setIfMissing("products", item.id, item)),
    ...announcements.map((item) => setIfMissing("announcements", item.id, item)),
    ...stats.map((item) => setIfMissing("stats", item.id, item)),
    ...settings.map((item) => setIfMissing("settings", item.id, item)),
  ]);

  // Empty starter/meta documents make these collections visible in Firestore's console.
  await Promise.all([
    setIfMissing("orders", "_schema", { schemaOnly: true, items: [], total: 0, status: "schema" }),
    setIfMissing("messages", "_schema", { schemaOnly: true, text: "", sender: "admin", read: true }),
    setIfMissing("reviews", "_schema", { schemaOnly: true, rating: 5, comment: "" }),
    setIfMissing("carts", "_schema", { schemaOnly: true, quantity: 0 }),
    setIfMissing("wishlists", "_schema", { schemaOnly: true }),
  ]);

  return {
    success: true,
    message: "Firebase Firestore collections initialized successfully",
  };
}

const resetCollections = [
  "products",
  "categories",
  "announcements",
  "stats",
  "settings",
  "orders",
  "messages",
  "reviews",
  "carts",
  "wishlists",
];

async function deleteCollectionDocs(collectionName: string) {
  if (!db) throw new Error("Firebase Firestore is not initialized");

  const snap = await getDocs(collection(db, collectionName));
  await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
}

export async function resetFirebaseDatabase() {
  if (!db) throw new Error("Firebase Firestore is not initialized");

  await Promise.all(resetCollections.map((collectionName) => deleteCollectionDocs(collectionName)));
  return initializeFirebaseDatabase();
}
