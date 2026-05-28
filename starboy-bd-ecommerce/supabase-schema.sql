-- ============================================================
-- STARBOY BD — Supabase Production Schema
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Firebase/Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  phone text NOT NULL,
  email text,
  facebook_id text,
  avatar text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image text,
  banner text,
  description text,
  featured boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories"
  ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  full_description text,
  images text[] DEFAULT '{}',
  original_price numeric NOT NULL CHECK (original_price >= 0),
  offer_price numeric CHECK (offer_price >= 0),
  categories uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  availability text NOT NULL DEFAULT 'in_stock' CHECK (availability IN ('in_stock', 'out_of_stock', 'pre_order')),
  featured boolean NOT NULL DEFAULT false,
  trending boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  specs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Only admins can modify products"
  ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- CARTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own cart"
  ON public.carts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own wishlist"
  ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- MESSAGES (User ↔ Admin Chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  text text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'admin')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read and write own messages"
  ON public.messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all messages"
  ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'bar' CHECK (type IN ('popup', 'banner', 'bar')),
  active boolean NOT NULL DEFAULT false,
  cta_text text,
  cta_link text,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements are publicly readable"
  ON public.announcements FOR SELECT USING (true);

CREATE POLICY "Only admins can modify announcements"
  ON public.announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  total numeric NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- AUTO-ASSIGN ADMIN ROLE VIA TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, phone, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    new.email,
    CASE WHEN new.email = current_setting('app.settings.admin_gmail', true) 
         THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = current_setting('app.settings.admin_gmail', true) 
                THEN 'admin' ELSE public.profiles.role END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME ENABLE (for messages & cart updates)
-- ============================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.carts REPLICA IDENTITY FULL;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured);
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products (trending);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- ============================================================
-- SEED DATA (Demo Categories)
-- ============================================================
INSERT INTO public.categories (name, slug, image, description, featured, priority)
VALUES
  ('Urban Street', 'urban-street', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800', 'Contemporary street style essentials for the modern man.', true, 1),
  ('Premium Shirts', 'premium-shirts', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800', 'Handcrafted shirts with premium fabrics and perfect fits.', true, 2),
  ('Leather Goods', 'leather-goods', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800', 'Genuine leather belts, wallets, and accessories.', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA (Demo Announcement)
-- ============================================================
INSERT INTO public.announcements (title, content, type, active, priority)
VALUES
  ('Free Delivery', 'FREE DELIVERY ON ORDERS OVER 5,000 BDT | 100% SECURE PAYMENTS', 'bar', true, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONFIGURE STORAGE BUCKETS (Run after Storage is enabled)
-- ============================================================
-- These must be run AFTER you enable Storage in Supabase dashboard
-- Then run: INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
