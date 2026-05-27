import { NextResponse } from "next/server";
import { Client } from "pg";

const sql = `
-- STARBOY BD Auto-Setup Schema (camelCase columns matching TypeScript)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY,
  "username" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "facebookId" text,
  "avatar" text,
  "role" text NOT NULL DEFAULT 'user',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "image" text,
  "banner" text,
  "description" text,
  "featured" boolean NOT NULL DEFAULT false,
  "priority" integer NOT NULL DEFAULT 0,
  "icon" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "shortDescription" text,
  "fullDescription" text,
  "images" text[] DEFAULT '{}',
  "originalPrice" numeric NOT NULL DEFAULT 0,
  "offerPrice" numeric,
  "categories" uuid[] DEFAULT '{}',
  "tags" text[] DEFAULT '{}',
  "availability" text NOT NULL DEFAULT 'in_stock',
  "featured" boolean NOT NULL DEFAULT false,
  "trending" boolean NOT NULL DEFAULT false,
  "bestSeller" boolean NOT NULL DEFAULT false,
  "specs" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Carts
CREATE TABLE IF NOT EXISTS "carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL DEFAULT 1,
  "size" text,
  "color" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("userId", "productId")
);

-- Wishlists
CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("userId", "productId")
);

-- Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "userName" text NOT NULL,
  "rating" integer NOT NULL DEFAULT 5,
  "comment" text NOT NULL,
  "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "userName" text NOT NULL,
  "productId" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "productName" text,
  "text" text NOT NULL,
  "sender" text NOT NULL DEFAULT 'user',
  "read" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "content" text NOT NULL,
  "type" text NOT NULL DEFAULT 'bar',
  "active" boolean NOT NULL DEFAULT false,
  "ctaText" text,
  "ctaLink" text,
  "priority" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "items" jsonb NOT NULL DEFAULT '[]',
  "total" numeric NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'pending',
  "shippingAddress" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Seed Categories
INSERT INTO "categories" ("name","slug","image","description","featured","priority") VALUES
  ('Urban Street','urban-street','https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800','Contemporary street style essentials for the modern man.',true,1),
  ('Premium Shirts','premium-shirts','https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800','Handcrafted shirts with premium fabrics and perfect fits.',true,2),
  ('Leather Goods','leather-goods','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800','Genuine leather belts, wallets, and accessories.',true,3)
ON CONFLICT("slug") DO NOTHING;

-- Seed Products
INSERT INTO "products" ("name","slug","shortDescription","fullDescription","images","originalPrice","offerPrice","categories","tags","availability","featured","trending","bestSeller","specs") VALUES
  ('Pink Poplin Shirt','pink-poplin-shirt','Premium pink poplin cotton shirt with tailored fit.','Crafted from 100% Egyptian cotton poplin, this shirt features a tailored modern fit, spread collar, and genuine mother-of-pearl buttons. Perfect for both casual and semi-formal occasions.','{"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200"}',2800,2200,'{}','{"shirt","cotton","formal"}','in_stock',true,false,true,'{"Fabric":"Egyptian Cotton","Fit":"Tailored","Collar":"Spread"}'),
  ('M&S Light Blue Oxford','ms-light-blue-oxford','Classic light blue oxford shirt with modern silhouette.','The timeless Oxford shirt reimagined for the modern wardrobe. Features a button-down collar, chest pocket, and durable yet soft cotton weave.','{"https://images.unsplash.com/photo-1598032895397-b9472444bf93?q=80&w=1200"}',2600,null,'{}','{"shirt","oxford","classic"}','in_stock',true,true,false,'{"Fabric":"Oxford Cotton","Fit":"Regular","Collar":"Button Down"}'),
  ('Charcoal Premium Shirt','charcoal-premium-shirt','Dark charcoal premium shirt with micro-texture.','A statement piece in deep charcoal with subtle micro-texture. Features a slim fit, French placket, and curved hem.','{"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200"}',3200,2700,'{}','{"shirt","charcoal","slim"}','in_stock',true,false,false,'{"Fabric":"Premium Blend","Fit":"Slim","Placket":"French"}'),
  ('M&S Poplin Check Shirt','ms-poplin-check-shirt','Refined check pattern poplin shirt for everyday elegance.','Balancing tradition with contemporary style, this check poplin shirt offers breathability and a crisp finish.','{"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200"}',2500,null,'{}','{"shirt","check","poplin"}','in_stock',false,true,true,'{"Fabric":"Poplin","Pattern":"Check","Cuffs":"Adjustable"}'),
  ('Urban Street Hoodie','urban-street-hoodie','Heavyweight cotton hoodie with structured fit.','Built for the streets. This heavyweight cotton hoodie features a structured oversized fit, double-layered hood, and premium ribbed cuffs.','{"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200"}',3800,3200,'{}','{"hoodie","street","casual"}','in_stock',true,true,true,'{"Fabric":"Heavy Cotton","Weight":"450 GSM","Fit":"Oversized"}'),
  ('Leather Signature Belt','leather-signature-belt','Full-grain leather belt with brushed brass buckle.','Handcrafted from full-grain vegetable-tanned leather. Features a minimal brushed brass buckle and refined stitching.','{"https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1200"}',1800,null,'{}','{"belt","leather","accessory"}','in_stock',true,false,false,'{"Leather":"Full Grain","Tanning":"Vegetable","Buckle":"Brass"}'),
  ('Classic Aviators','classic-aviators','Polarized aviator sunglasses with gold frames.','Timeless aviator silhouette with 24k gold-plated stainless steel frames and polarized lenses.','{"https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1200"}',2400,1900,'{}','{"sunglasses","aviator","gold"}','in_stock',false,true,true,'{"Frame":"Stainless Steel","Coating":"24k Gold","Lenses":"Polarized"}'),
  ('Structured Street Cap','structured-street-cap','Minimal structured cap with embroidered logo.','Six-panel structured cap in premium cotton twill. Features subtle embroidered branding, adjustable leather strap closure, and reinforced eyelets.','{"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200"}',1200,null,'{}','{"cap","street","minimal"}','in_stock',false,false,false,'{"Panels":"6","Fabric":"Cotton Twill","Closure":"Leather Strap"}')
ON CONFLICT("slug") DO NOTHING;

-- Link products to categories by slug lookup (run after seed)
UPDATE "products" SET "categories" = ARRAY[
  (SELECT "id" FROM "categories" WHERE "slug"='premium-shirts'),
  (SELECT "id" FROM "categories" WHERE "slug"='urban-street')
]
WHERE "slug" IN ('pink-poplin-shirt','ms-light-blue-oxford','charcoal-premium-shirt','ms-poplin-check-shirt');

UPDATE "products" SET "categories" = ARRAY[
  (SELECT "id" FROM "categories" WHERE "slug"='urban-street')
]
WHERE "slug"='urban-street-hoodie';

UPDATE "products" SET "categories" = ARRAY[
  (SELECT "id" FROM "categories" WHERE "slug"='leather-goods')
]
WHERE "slug"='leather-signature-belt';

UPDATE "products" SET "categories" = ARRAY[
  (SELECT "id" FROM "categories" WHERE "slug"='urban-street')
]
WHERE "slug"='structured-street-cap';

UPDATE "products" SET "categories" = ARRAY[
  (SELECT "id" FROM "categories" WHERE "slug"='premium-shirts')
]
WHERE "slug"='classic-aviators';

-- Seed Announcements
INSERT INTO "announcements" ("title","content","type","active","priority") VALUES
  ('Free Delivery','FREE DELIVERY ON ORDERS OVER 5,000 BDT | 100% SECURE PAYMENTS','bar',true,1)
ON CONFLICT DO NOTHING;

-- Seed Reviews
INSERT INTO "reviews" ("userId","userName","rating","comment","productId","createdAt") VALUES
  ('u1','Rafiq Hossain',5,'The quality of the Pink Poplin shirt exceeded my expectations. Perfect fit and premium feel.',(SELECT "id" FROM "products" WHERE "slug"='pink-poplin-shirt'),'2026-05-20T10:00:00Z'),
  ('u2','Asif Khan',5,'STARBOY BD never disappoints. The leather belt is genuine and ages beautifully.',(SELECT "id" FROM "products" WHERE "slug"='leather-signature-belt'),'2026-05-18T14:30:00Z'),
  ('u3','Tanvir Ahmed',4,'Great urban hoodie. Heavyweight material and the fit is exactly as described.',(SELECT "id" FROM "products" WHERE "slug"='urban-street-hoodie'),'2026-05-15T09:15:00Z')
ON CONFLICT DO NOTHING;
`;

export const runtime = "nodejs";

export async function POST() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "SUPABASE_DB_URL not set" }, { status: 500 });
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    return NextResponse.json({ success: true, message: "Database initialized and seeded" });
  } catch (err: any) {
    await client.end().catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
