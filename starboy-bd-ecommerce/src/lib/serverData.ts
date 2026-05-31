/**
 * Server-side Firestore reader with true ISR caching.
 *
 * WHY THIS EXISTS:
 *   The storefront sections used to fetch from Firestore in the BROWSER on every
 *   visit (client-side useEffect), so every visitor cost fresh Firestore reads.
 *   This module fetches the same data on the SERVER via the Firestore REST API
 *   and wraps it in Next.js `fetch(..., { next: { revalidate } })`, so the
 *   result is cached and SHARED across all visitors, refreshed on a timer.
 *
 *   Effect: the catalog is read ~once per revalidate window TOTAL (e.g. once an
 *   hour) instead of once per visitor — turning a traffic-scaled read cost into
 *   a near-flat one. This is the single biggest Firestore-quota optimization.
 *
 * NO SECRETS NEEDED:
 *   Catalog collections (products, categories, settings, stats, testimonials)
 *   are public-readable per the Firestore security rules, so the public web API
 *   key is sufficient. No Firebase Admin service-account key required.
 */

const PROJECT_ID = "dg-hub-841e8";
const API_KEY = "AIzaSyCUIN5oRpr47c4JjK-8e_efta_Weh60Akc";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Default revalidation windows (seconds).
export const REVALIDATE = {
  catalog: 3600,   // products / categories / settings / stats — 1 hour
  product: 1800,   // single product page — 30 min
  testimonials: 3600,
};

// ---- Firestore REST value → plain JS value ---------------------------------
function decodeValue(v: any): any {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  return null;
}

function decodeFields(fields: Record<string, any>): any {
  const out: any = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

function decodeDoc(doc: any): any {
  const id = doc.name ? doc.name.split("/").pop() : undefined;
  return { id, ...decodeFields(doc.fields || {}) };
}

// ---- Core fetchers ---------------------------------------------------------

/** Fetch all docs in a collection (cached/ISR), filtering out schema-only rows. */
async function fetchCollection(
  name: string,
  revalidate: number
): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/${name}?key=${API_KEY}&pageSize=300`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const docs = (json.documents || []).map(decodeDoc);
    return docs.filter((d: any) => d.schemaOnly !== true);
  } catch {
    return [];
  }
}

/** Fetch a single document by id (cached/ISR). */
async function fetchDoc(
  collection: string,
  id: string,
  revalidate: number
): Promise<any | null> {
  try {
    const res = await fetch(`${BASE}/${collection}/${id}?key=${API_KEY}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const doc = decodeDoc(json);
    return doc.schemaOnly === true ? null : doc;
  } catch {
    return null;
  }
}

// ---- Helpers ---------------------------------------------------------------
function byCreatedDesc(a: any, b: any) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}
function byPriorityAsc(a: any, b: any) {
  return (a.priority || 0) - (b.priority || 0);
}

// ---- Public API used by server components ----------------------------------

export interface HomeData {
  settings: Record<string, string>;
  categories: any[];
  newArrivals: any[];
  trending: any[];
  bestSellers: any[];
  stats: any[];
  testimonials: any[];
}

/** One cached batch for the entire homepage. */
export async function getHomeData(): Promise<HomeData> {
  const [products, categories, settingsArr, stats, testimonials] =
    await Promise.all([
      fetchCollection("products", REVALIDATE.catalog),
      fetchCollection("categories", REVALIDATE.catalog),
      fetchCollection("settings", REVALIDATE.catalog),
      fetchCollection("stats", REVALIDATE.catalog),
      fetchCollection("testimonials", REVALIDATE.testimonials),
    ]);

  const settings: Record<string, string> = {};
  settingsArr.forEach((s: any) => {
    if (s.key) settings[s.key] = String(s.value ?? "");
  });

  const sortedProducts = [...products].sort(byCreatedDesc);

  return {
    settings,
    categories: categories.filter((c) => c.featured).sort(byPriorityAsc),
    newArrivals: sortedProducts.slice(0, 4),
    trending: sortedProducts.filter((p) => p.trending).slice(0, 4),
    bestSellers: sortedProducts.filter((p) => p.bestSeller).slice(0, 4),
    stats: stats.filter((s) => s.active).sort(byPriorityAsc),
    testimonials: testimonials
      .filter((t) => t.active)
      .sort(byCreatedDesc)
      .slice(0, 6),
  };
}

/** Cached settings map (for Navbar/Footer if rendered server-side). */
export async function getSettings(): Promise<Record<string, string>> {
  const arr = await fetchCollection("settings", REVALIDATE.catalog);
  const map: Record<string, string> = {};
  arr.forEach((s: any) => {
    if (s.key) map[s.key] = String(s.value ?? "");
  });
  return map;
}

/** Cached full catalog for shop/search pages. */
export async function getAllProducts(): Promise<any[]> {
  const products = await fetchCollection("products", REVALIDATE.catalog);
  return products.sort(byCreatedDesc);
}

export async function getCategories(): Promise<any[]> {
  const cats = await fetchCollection("categories", REVALIDATE.catalog);
  return cats.sort(byPriorityAsc);
}

/** Cached single product by slug (falls back to id). */
export async function getProductBySlug(slug: string): Promise<any | null> {
  // Try id-style direct fetch first (cheap), else scan the cached catalog.
  const all = await getAllProducts();
  return (
    all.find((p) => p.slug === slug) ||
    all.find((p) => p.id === slug) ||
    (await fetchDoc("products", slug, REVALIDATE.product))
  );
}
