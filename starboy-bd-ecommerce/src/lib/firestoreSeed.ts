import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

// Firestore rejects `undefined` field values. Remove any undefined fields from a
// payload before writing (e.g. demo products with no offerPrice).
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as unknown as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: any = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}
import { db } from "@/lib/firebase";

export const demoProducts = [
  {
    name: "Classic Oxford Shirt",
    slug: "classic-oxford-shirt",
    shortDescription: "Premium cotton Oxford shirt with modern slim fit.",
    fullDescription: "Crafted from premium 100% cotton Oxford fabric, this shirt combines classic styling with modern tailoring. Features a button-down collar, chest pocket, and adjustable cuffs.",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"],
    originalPrice: 2500,
    offerPrice: 1999,
    categories: [],
    tags: ["shirt", "oxford", "cotton"],
    availability: "in_stock",
    featured: true,
    trending: true,
    bestSeller: true,
    stockQuantity: 50,
    specs: { Material: "100% Cotton", Fit: "Slim Fit", Care: "Machine Wash" },
  },
  {
    name: "Urban Street Hoodie",
    slug: "urban-street-hoodie",
    shortDescription: "Heavyweight fleece hoodie for everyday street style.",
    fullDescription: "Premium heavyweight fleece hoodie with kangaroo pocket and adjustable drawstring hood. Perfect for layering or standalone wear.",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80"],
    originalPrice: 3500,
    offerPrice: 2799,
    categories: [],
    tags: ["hoodie", "streetwear", "casual"],
    availability: "in_stock",
    featured: true,
    trending: true,
    bestSeller: false,
    stockQuantity: 30,
    specs: { Material: "Heavyweight Fleece", Fit: "Regular Fit", Care: "Machine Wash Cold" },
  },
  {
    name: "Premium Leather Belt",
    slug: "premium-leather-belt",
    shortDescription: "Genuine full-grain leather belt with polished buckle.",
    fullDescription: "Handcrafted from full-grain Italian leather with a brushed nickel buckle. Ages beautifully with wear, developing a rich patina over time.",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
    originalPrice: 1800,
    categories: [],
    tags: ["belt", "leather", "accessory"],
    availability: "in_stock",
    featured: true,
    trending: false,
    bestSeller: true,
    stockQuantity: 40,
    specs: { Material: "Full-Grain Leather", Buckle: "Brushed Nickel", Width: "35mm" },
  },
  {
    name: "Slim Fit Chino Pants",
    slug: "slim-fit-chino-pants",
    shortDescription: "Versatile slim fit chinos in stretch cotton twill.",
    fullDescription: "Modern slim fit chinos crafted from stretch cotton twill. Features a zip fly, button closure, and four pockets.",
    images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80"],
    originalPrice: 3200,
    offerPrice: 2499,
    categories: [],
    tags: ["pants", "chino", "casual"],
    availability: "in_stock",
    featured: false,
    trending: true,
    bestSeller: true,
    stockQuantity: 60,
    specs: { Material: "Stretch Cotton Twill", Fit: "Slim Fit", Rise: "Mid Rise" },
  },
  {
    name: "Designer Aviator Sunglasses",
    slug: "designer-aviator-sunglasses",
    shortDescription: "UV400 polarized lenses with metal frame.",
    fullDescription: "Classic aviator design with premium polarized UV400 lenses. Lightweight metal frame with adjustable nose pads.",
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80"],
    originalPrice: 2800,
    offerPrice: 2199,
    categories: [],
    tags: ["sunglasses", "accessory", "aviator"],
    availability: "in_stock",
    featured: false,
    trending: false,
    bestSeller: false,
    stockQuantity: 25,
    specs: { Lens: "Polarized UV400", Frame: "Metal", Protection: "UV400" },
  },
  {
    name: "Minimalist Leather Wallet",
    slug: "minimalist-leather-wallet",
    shortDescription: "Slim bifold wallet in premium leather.",
    fullDescription: "Ultra-slim bifold wallet crafted from premium leather. Features 6 card slots, 1 bill compartment, and RFID blocking technology.",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80"],
    originalPrice: 1500,
    offerPrice: 1199,
    categories: [],
    tags: ["wallet", "leather", "accessory"],
    availability: "in_stock",
    featured: false,
    trending: false,
    bestSeller: false,
    stockQuantity: 45,
    specs: { Material: "Premium Leather", Slots: "6 Cards", Feature: "RFID Blocking" },
  },
];

export const demoCategories = [
  { name: "Men's Collection", slug: "mens-collection", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&q=75", description: "Premium ready-to-wear for the modern man", featured: true, priority: 1, icon: "Shirt" },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=75", description: "Complete your look with premium accessories", featured: true, priority: 2, icon: "ShoppingBag" },
  { name: "Urban Street", slug: "urban-street", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=75", description: "Streetwear essentials for everyday style", featured: true, priority: 3, icon: "TrendingUp" },
];

export const demoSettings = [
  { key: "hero_title", value: "THE MODERN STANDARD.", type: "text" },
  { key: "hero_subtitle", value: "Elevate your style with premium, ready-to-wear collections crafted for the modern Bangladeshi gentleman.", type: "text" },
  { key: "hero_cta_primary", value: "Shop New Arrivals", type: "text" },
  { key: "hero_cta_secondary", value: "Explore Collections", type: "text" },
  { key: "brand_section_title", value: "Experience Our Brand", type: "text" },
  { key: "brand_section_subtitle", value: "More than just clothing — a lifestyle crafted for the modern Bangladeshi gentleman.", type: "text" },
  { key: "footer_outlet_text", value: "You are welcome to our outlet", type: "text" },
  { key: "footer_outlet_location", value: "Korim mes, College road, Satkhira", type: "text" },
];

export const demoStats = [
  { label: "Happy Customers", value: "15000", suffix: "+", icon: "Users", active: true, priority: 1 },
  { label: "Premium Products", value: "500", suffix: "+", icon: "Package", active: true, priority: 2 },
  { label: "Orders Delivered", value: "25000", suffix: "+", icon: "ShoppingCart", active: true, priority: 3 },
  { label: "5-Star Reviews", value: "4.8", suffix: "★", icon: "Star", active: true, priority: 4 },
];

// Helper: clear all docs in a collection
async function clearCollection(colName: string) {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, colName));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, colName, d.id));
    }
  } catch (e) {
    console.warn(`Could not clear collection ${colName}:`, e);
  }
}

// Helper: seed docs with stable IDs
async function seedCollection(colName: string, data: any[], keyField: string | null = null) {
  if (!db) return;
  for (const item of data) {
    const id = keyField ? item[keyField] : `${colName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await setDoc(doc(db, colName, id), stripUndefined({ ...item, createdAt: item.createdAt || new Date().toISOString() }));
  }
}

export async function initializeFirebaseDatabase() {
  if (!db) throw new Error("Firebase not initialized");
  await clearCollection("products");
  await clearCollection("categories");
  await clearCollection("settings");
  await clearCollection("stats");

  await seedCollection("categories", demoCategories, "slug");
  await seedCollection("settings", demoSettings, "key");
  await seedCollection("stats", demoStats, "label");
  // Products get random IDs since they have no unique key
  for (const p of demoProducts) {
    const id = `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await setDoc(doc(db, "products", id), stripUndefined({ ...p, createdAt: new Date().toISOString() }));
  }
  console.log("Database initialized with demo data.");
}

export async function resetFirebaseDatabase() {
  if (!db) throw new Error("Firebase not initialized");
  const collections = ["products", "categories", "settings", "stats", "announcements", "carts", "wishlists", "orders", "messages", "reviews"];
  for (const col of collections) {
    await clearCollection(col);
  }
  console.log("Database reset complete.");
    }
