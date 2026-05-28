/*************************************************************
 * STARBOY BD — Demo Product Seeder
 * Run with: node scripts/seed-demo.js
 * Requires: @supabase/supabase-js
 *************************************************************/

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const demoProducts = [
  {
    name: "Pink Poplin Shirt",
    slug: "pink-poplin-shirt",
    short_description: "Premium pink poplin cotton shirt with tailored fit.",
    full_description: "Crafted from 100% Egyptian cotton poplin, this shirt features a tailored modern fit, spread collar, and genuine mother-of-pearl buttons.",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200"],
    original_price: 2800,
    offer_price: 2200,
    categories: [],
    tags: ["shirt", "cotton", "formal"],
    availability: "in_stock",
    featured: true,
    trending: false,
    best_seller: true,
    specs: { Fabric: "Egyptian Cotton", Fit: "Tailored", Collar: "Spread" }
  },
  {
    name: "M&S Light Blue Oxford",
    slug: "ms-light-blue-oxford",
    short_description: "Classic light blue oxford shirt with modern silhouette.",
    full_description: "The timeless Oxford shirt reimagined for the modern wardrobe. Features a button-down collar, chest pocket, and durable yet soft cotton weave.",
    images: ["https://images.unsplash.com/photo-1598032895397-b9472444bf93?q=80&w=1200"],
    original_price: 2600,
    offer_price: null,
    categories: [],
    tags: ["shirt", "oxford", "classic"],
    availability: "in_stock",
    featured: true,
    trending: true,
    best_seller: false,
    specs: { Fabric: "Oxford Cotton", Fit: "Regular", Collar: "Button Down" }
  },
  {
    name: "Leather Signature Belt",
    slug: "leather-signature-belt",
    short_description: "Full-grain leather belt with brushed brass buckle.",
    full_description: "Handcrafted from full-grain vegetable-tanned leather. Features a minimal brushed brass buckle and refined stitching.",
    images: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1200"],
    original_price: 1800,
    offer_price: null,
    categories: [],
    tags: ["belt", "leather", "accessory"],
    availability: "in_stock",
    featured: true,
    trending: false,
    best_seller: false,
    specs: { Leather: "Full Grain", Buckle: "Brass", Width: "35mm" }
  }
];

async function seed() {
  // Get category IDs to link
  const { data: cats } = await supabase.from('categories').select('id,slug');
  const catMap = {};
  (cats || []).forEach(c => catMap[c.slug] = c.id);

  const productsWithCats = demoProducts.map(p => ({
    ...p,
    categories: [
      catMap['premium-shirts'],
      catMap['urban-street'],
      catMap['leather-goods']
    ].filter(Boolean)
  }));

  const { data, error } = await supabase.from('products').upsert(productsWithCats, { onConflict: 'slug' });
  if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
  console.log('Seeded', data?.length || productsWithCats.length, 'products successfully!');
}

seed();
