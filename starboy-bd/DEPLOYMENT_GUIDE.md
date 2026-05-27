# STARBOY BD — Complete Production Deployment Guide

This guide walks you through making STARBOY BD 100% live with real authentication, real database, real payments, and a custom domain.

**Estimated time:** 2–4 hours (first time) / 30 minutes (if experienced)

---

## Phase 1: Prerequisites

Before touching code, create accounts at:

1. **GitHub** ([github.com](https://github.com)) — to host code
2. **Vercel** ([vercel.com](https://vercel.com)) — to host the frontend
3. **Firebase** ([console.firebase.google.com](https://console.firebase.google.com)) — auth, analytics, storage
4. **Supabase** ([supabase.com](https://supabase.com)) — PostgreSQL database
5. **Cloudflare** (optional, for custom domain DNS) — fastest DNS + SSL

---

## Phase 2: Firebase Setup (Authentication + Analytics + Storage)

### Step 2.1 — Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project**
3. Name it: `starboy-bd-prod`
4. Disable Google Analytics inside Firebase (we'll add it manually for more control)
5. Click **Create Project**

### Step 2.2 — Enable Phone Authentication

1. In Firebase sidebar, click **Authentication** → **Get Started**
2. Click **Sign-in method**
3. Find **Phone** and click it
4. Toggle **Enable**
5. In the same page, add your Bangladesh phone number in **Test numbers** for development:
   - Phone: `+8801712345678`
   - Code: `123456`
6. Click **Save**

### Step 2.3 — Enable Firestore (for announcements & activity logs)

1. Sidebar → **Firestore Database** → **Create Database**
2. Choose **Start in production mode**
3. Select region: `asia-south1` (Mumbai — closest to Bangladesh)
4. Click **Enable**

### Step 2.4 — Enable Storage (for product images)

1. Sidebar → **Storage** → **Get Started**
2. Select **Start in production mode**
3. Choose region: `asia-south1`
4. Click **Done**

### Step 2.5 — Copy Firebase Config

1. Sidebar → **Project Overview** → click the **</>** (Web) icon
2. Register app name: `starboy-bd-web`
3. Check **Firebase Hosting** — **NO** (we use Vercel)
4. Click **Register**
5. Copy the `firebaseConfig` object values. You will paste them into Vercel later.

---

## Phase 3: Supabase Setup (Database + Realtime + Image CDN)

### Step 3.1 — Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Organization: your name
4. Project name: `starboy-bd-db`
5. Database password: generate a strong one (save in a password manager)
6. Region: `Asia Pacific (Mumbai)` — **Critical for Bangladesh speed**
7. Click **Create New Project** (wait ~2 minutes)

### Step 3.2 — Get API Keys

1. Project sidebar → **Project Settings** (gear icon at bottom)
2. Click **API** in the left menu
3. Copy:
   - `URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Data API** (same page), scroll down to **service_role key**
5. Copy `service_role secret` → this is `SUPABASE_SERVICE_ROLE_KEY`
   - **Warning:** Never expose this in frontend code. Only use in API routes or server actions.

### Step 3.3 — Create Database Tables

Go to **Table Editor** in Supabase sidebar. Create these tables with **RLS (Row Level Security)** enabled.

#### Table: `products`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| name | text | — | false |
| slug | text | — | false |
| short_description | text | — | true |
| full_description | text | — | true |
| images | text[] | — | true |
| original_price | numeric | — | false |
| offer_price | numeric | — | true |
| categories | uuid[] | — | true |
| tags | text[] | — | true |
| availability | text | 'in_stock' | false |
| featured | boolean | false | false |
| trending | boolean | false | false |
| best_seller | boolean | false | false |
| specs | jsonb | — | true |
| created_at | timestamptz | now() | false |

- Set primary key: `id`
- Enable RLS
- Add policy: `Enable read access for all users` → USING (true)
- Add policy: `Enable all for admin` → USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT auth.uid FROM admin_users))

#### Table: `categories`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| name | text | — | false |
| slug | text | — | false |
| image | text | — | true |
| banner | text | — | true |
| description | text | — | true |
| featured | boolean | false | false |
| priority | integer | 0 | false |
| icon | text | — | true |
| created_at | timestamptz | now() | false |

- Enable RLS
- Public read policy: `true`

#### Table: `profiles` (extends Firebase Auth users)

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | — | false |
| username | text | — | false |
| phone | text | — | false |
| email | text | — | true |
| facebook_id | text | — | true |
| avatar | text | — | true |
| role | text | 'user' | false |
| created_at | timestamptz | now() | false |

- `id` references `auth.users(id)`
- Enable RLS
- Policy: `Users can read own profile` → USING (auth.uid() = id)
- Policy: `Users can update own profile` → USING (auth.uid() = id)

#### Table: `carts`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| user_id | uuid | — | false |
| product_id | uuid | — | false |
| quantity | integer | 1 | false |
| size | text | — | true |
| color | text | — | true |
| created_at | timestamptz | now() | false |

- Enable RLS
- Policy: `Users can CRUD own cart` → USING (auth.uid() = user_id)

#### Table: `wishlists`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| user_id | uuid | — | false |
| product_id | uuid | — | false |
| created_at | timestamptz | now() | false |

- Enable RLS
- Policy: `Users can CRUD own wishlist` → USING (auth.uid() = user_id)

#### Table: `reviews`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| user_id | uuid | — | false |
| user_name | text | — | false |
| rating | integer | — | false |
| comment | text | — | false |
| product_id | uuid | — | false |
| created_at | timestamptz | now() | false |

- Enable RLS
- Public read: true
- Insert: authenticated users only

#### Table: `messages`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| user_id | uuid | — | false |
| user_name | text | — | false |
| product_id | uuid | — | true |
| product_name | text | — | true |
| text | text | — | false |
| sender | text | — | false |
| created_at | timestamptz | now() | false |
| read | boolean | false | false |

- Enable RLS
- Policy: `Users can read own messages` → USING (auth.uid() = user_id)

#### Table: `announcements`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| title | text | — | false |
| content | text | — | false |
| type | text | 'bar' | false |
| active | boolean | false | false |
| cta_text | text | — | true |
| cta_link | text | — | true |
| priority | integer | 0 | false |
| created_at | timestamptz | now() | false |

- Enable RLS
- Public read: `true`

#### Table: `orders` (for future)

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | uuid | gen_random_uuid() | false |
| user_id | uuid | — | false |
| items | jsonb | — | false |
| total | numeric | — | false |
| status | text | 'pending' | false |
| shipping_address | jsonb | — | true |
| created_at | timestamptz | now() | false |

- Enable RLS
- Policy: `Users can read own orders` → USING (auth.uid() = user_id)

### Step 3.4 — Set Admin User in Supabase

After your tables are created, run this SQL in Supabase SQL Editor:

```sql
-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then in your app, after the first user registers with `admin@starboybd.com`, manually update their role:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@starboybd.com';
```

Or create an Edge Function to auto-promote that email on signup (recommended).

---

## Phase 4: Environment Variables

In your project root, create `.env.local`:

```env
# ============================================================
# FIREBASE (Auth, Storage, Analytics, Firestore)
# ============================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=starboy-bd-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=starboy-bd-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=starboy-bd-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================================
# SUPABASE (PostgreSQL Database, Storage CDN)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://your_project_ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================================
# APP CONFIG
# ============================================================
ADMIN_GMAIL=admin@starboybd.com
NEXT_PUBLIC_APP_URL=https://www.starboybd.com
```

**Security rules:**
- `NEXT_PUBLIC_*` variables are exposed to the browser — only use public-safe keys.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only**. Never prefix with `NEXT_PUBLIC_`.
- Never commit `.env.local` to Git. It is already in `.gitignore` by default in Next.js.

---

## Phase 5: Swap Mock Data for Real Backend

### Step 5.1 — Update AuthContext to use Firebase

Open `src/context/AuthContext.tsx`. Replace the `login()` function:

```typescript
import { auth, PhoneAuthProvider, signInWithCredential } from "@/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

// In login():
const login = async (phone: string, password: string) => {
  // For demo/password-less flows, use Firebase custom token from your API
  // Or implement OTP:
  const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
  window.confirmationResult = confirmation;
};

const verifyOtp = async (otp: string) => {
  const credential = PhoneAuthProvider.credential(window.confirmationResult.verificationId, otp);
  const result = await signInWithCredential(auth, credential);
  const firebaseUser = result.user;
  
  // Sync to Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firebaseUser.uid)
    .single();
    
  setUser(profile);
  localStorage.setItem("sb_user", JSON.stringify(profile));
};
```

For a simpler production path, use **Firebase Auth with email/password** plus phone as a profile field, or use **Supabase Auth** directly. Phone OTP in Firebase requires a backend to generate custom tokens if you want to skip the invisible reCAPTCHA complications in some regions.

### Step 5.2 — Update Data Fetching

In each page/component where you import from `@/data/products`, replace with Supabase queries:

**Example: Fetching products on Shop page**

```typescript
import { supabase } from "@/lib/supabase";

// In your component:
const [products, setProducts] = useState<Product[]>([]);

useEffect(() => {
  const fetch = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('availability', 'in_stock')
      .order('created_at', { ascending: false });
      
    if (!error && data) setProducts(data);
  };
  fetch();
}, []);
```

**For images:** Upload to Supabase Storage bucket `products`. The public URL format is:

```
https://your_project_ref.supabase.co/storage/v1/object/public/products/image-name.jpg
```

### Step 5.3 — Add Server API Routes (optional but recommended)

Create `src/app/api/products/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*');
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

This keeps your `service_role` key safe on the server.

---

## Phase 6: Build & Test Locally

```bash
# 1. Enter project
cd starboy-bd

# 2. Install packages
npm install

# 3. Add your real .env.local
cp .env.local.example .env.local
# Then edit .env.local with real keys

# 4. Build for production (catches TypeScript errors)
npm run build

# 5. Start production server locally
npm run start
```

Test everything:
- Homepage loads without errors
- Click a product → product page works
- Add to cart → cart updates
- Search returns results
- Login page renders
- Admin panel renders (login with admin@starboybd.com after role update)

If `npm run build` fails, fix the errors before deploying. Common issues:
- Missing types: `npm install -D @types/react`
- Image domain not whitelisted in `next.config.js`

---

## Phase 7: Deploy to Vercel (Production)

### Method A: Git-based (Recommended)

1. **Create a GitHub repo**
   ```bash
   git init
   git add .
   git commit -m "Initial STARBOY BD production build"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/starboy-bd.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import `starboy-bd` from GitHub
   - Framework preset should auto-detect: **Next.js**
   - **Root Directory:** `./` (default)
   - Click **Deploy**

3. **Add Environment Variables**
   - In Vercel dashboard, go to **Project Settings** → **Environment Variables**
   - Add every key from your `.env.local`
   - Set **Environment** to `Production` (and also `Preview` if you want staging)
   - Click **Save**
   - Redeploy: **Deployments** → click the latest → **Redeploy**

4. **Done.** Your site is live at `https://starboy-bd.vercel.app`

### Method B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy (follow prompts)
vercel --prod

# Link project if asked
# Set build command: next build
# Set output directory: .next
```

---

## Phase 8: Custom Domain (www.starboybd.com)

### Step 8.1 — Buy Domain

Buy `starboybd.com` from:
- Namecheap
- GoDaddy
- Bangladesh: [WebHostBD](https://www.webhostbd.com), [XeonBD](https://www.xeonbd.com)

### Step 8.2 — Add Domain in Vercel

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Enter: `www.starboybd.com`
3. Vercel will show you DNS records to add.

### Step 8.3 — Configure DNS

If using **Cloudflare** (recommended for Bangladesh performance):

1. Add your domain to Cloudflare
2. Change nameservers at your registrar to Cloudflare's
3. In Cloudflare DNS tab, add:
   - **Type:** CNAME | **Name:** www | **Target:** cname.vercel-dns.com | **Proxy status:** DNS only (grey cloud)
   - **Type:** A | **Name:** @ | **IPv4 address:** 76.76.21.21 (Vercel's apex record)
4. In Cloudflare → **SSL/TLS** → set mode to **Full (Strict)**

If using **registrar DNS directly**:
- Add CNAME `www` → `cname.vercel-dns.com`
- Add A record `@` → `76.76.21.21`

### Step 8.4 — Verify

- Vercel will automatically verify and issue an SSL certificate.
- Visit `https://www.starboybd.com` — it should load your site with a green lock.
- Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to `https://www.starboybd.com` and redeploy.

---

## Phase 9: Post-Launch Checklist

### Performance
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) — aim for 90+ mobile
- [ ] Enable Vercel **Edge Network** caching
- [ ] Compress product images to WebP/AVIF before upload
- [ ] Lazy load below-fold images (already implemented with Next.js Image)

### SEO
- [ ] Submit sitemap to Google Search Console: `https://www.starboybd.com/sitemap.xml`
- [ ] Create `src/app/sitemap.ts` (Next.js 14 App Router supports this)
- [ ] Add `robots.ts` for crawlers
- [ ] Set OG images for homepage and product pages

### Security
- [ ] Enable 2FA on Firebase, Supabase, Vercel, GitHub accounts
- [ ] Review Supabase RLS policies — ensure no table is public-write except needed
- [ ] Set Firebase Storage rules:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/(default)/documents/profiles/$(request.auth.uid)) &&
        get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Analytics & Tracking
- [ ] Connect Firebase Analytics in `src/lib/firebase.ts` (uncomment initialization)
- [ ] Add Google Analytics 4 tag if preferred over Firebase
- [ ] Add Facebook Pixel for Bangladesh ad retargeting

### Operations
- [ ] Create a separate **Staging** project in Vercel (auto-deploys on PRs)
- [ ] Set up **Vercel Preview Comments** for team collaboration
- [ ] Configure **Uptime monitoring** (Vercel has built-in, or use UptimeRobot)

---

## Phase 10: Scaling (Future)

| Traffic Level | Action |
|---------------|--------|
| 1,000 visits/day | Current setup handles easily |
| 10,000 visits/day | Enable Vercel Pro for better bandwidth |
| 50,000 visits/day | Add Supabase read replicas, Redis caching layer |
| 100,000+ / day | Move heavy product APIs to Edge Functions, add CDN for images |

For Bangladesh specifically, consider:
- Adding a **Bangladesh payment gateway** (bKash/Nagad via SSLCommerz or aamarPay)
- Setting up **Pathao/Paperfly** shipping integration
- Using a **local SMS provider** (SSL Wireless, Twilio BD) for OTP if Firebase phone auth is inconsistent

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with "module not found" | Run `npm install` again. Check `package.json` versions match. |
| Images broken in production | Add the Supabase storage hostname to `next.config.js` `images.remotePatterns`. |
| Firebase OTP not sending | Check if test number is configured. In production, enable reCAPTCHA invisible. |
| Supabase RLS blocks reads | Add a public read policy for unauthenticated users on products/categories. |
| Admin panel says "Unauthorized" | Update the user's role to `admin` in Supabase `profiles` table. |
| Styles missing on Vercel | Ensure `postcss.config.js` and `tailwind.config.ts` are committed to Git. |
| Slow in Bangladesh | Choose `asia-south1` (Mumbai) in both Firebase and Supabase regions. |

---

## Final File Structure (Production)

```
starboy-bd/
├── .env.local                    ← NOT COMMITTED
├── .env.local.example            ← Committed template
├── next.config.js
├── package.json
├── public/
│   └── images/                   ← Your real product photos (or use Supabase Storage)
├── src/
│   ├── app/
│   │   ├── api/                  ← Server-side API routes (secure admin ops)
│   │   ├── admin/page.tsx        ← Admin dashboard
│   │   ├── auth/page.tsx         ← Login/register with OTP
│   │   ├── cart/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── product/[id]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── shop/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── layout.tsx            ← Root layout with providers
│   │   ├── globals.css
│   │   └── page.tsx              ← Homepage
│   ├── components/
│   │   ├── layout/               ← Navbar, Footer, MobileMenu, AnnouncementBar
│   │   ├── sections/             ← Hero, Categories, NewArrivals, etc.
│   │   └── ui/                   ← ProductCard, CategoryCard
│   ├── context/
│   │   ├── AuthContext.tsx       ← Firebase + Supabase profile sync
│   │   ├── CartContext.tsx       ← Supabase cart sync
│   │   └── WishlistContext.tsx   ← Supabase wishlist sync
│   ├── data/
│   │   └── products.ts           ← DELETE or rename after DB migration
│   ├── hooks/
│   │   └── useRealtime.ts        ← Optional: Supabase realtime listeners
│   ├── lib/
│   │   ├── firebase.ts           ← Firebase init (auth, db, storage)
│   │   ├── supabase.ts           ← Supabase clients (public + admin)
│   │   └── utils.ts              ← cn(), formatPrice(), helpers
│   └── types/
│       └── index.ts              ← All TypeScript interfaces
└── README.md
```

---

## You Are Live When...

- [x] `https://www.starboybd.com` loads
- [x] Products pull from Supabase (not mock data)
- [x] Users can register/login with real OTP
- [x] Cart/Wishlist save per user in Supabase
- [x] Admin can add/edit products from `/admin`
- [x] SSL certificate shows green lock
- [x] PageSpeed mobile score ≥ 85

**Welcome to production. Your brand is now live.**
