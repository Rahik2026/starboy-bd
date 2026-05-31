# STARBOY BD — Premium E-Commerce Platform

A production-ready luxury e-commerce platform built with **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Firebase**.

## Features

- **Luxury UI/UX** inspired by premium fashion houses
- **Mobile-first** responsive design with smooth animations
- **Firebase** backend (Firestore + Auth + Storage)
- **Static page generation** with ISR for performance
- **Optimized image delivery** (WebP only, reduced transformation variants)
- **Lazy loading** for all below-fold content
- **Cart & Wishlist** with localStorage fallback
- **Admin panel** for full store management

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Firebase (Firestore, Auth, Storage)
- lucide-react (icons)
- react-hot-toast (notifications)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Firebase config is already set in `src/lib/firebase.ts`.

### 3. Run development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start
```

## Performance Optimizations

- **Static homepage** generation with ISR (1-hour revalidation)
- **Lazy-loaded** below-fold sections
- **WebP-only** images with reduced transformation variants
- **24-hour image cache** to minimize Vercel transformations
- **Removed unused dependencies** (swiper, zustand, pg, supabase)
- **Optimized animations** (reduced duration, removed heavy effects)
- **CSS-only animations** replacing Framer Motion where possible
- **Minimal backdrop-blur** usage for mobile GPU performance
- **Pagination** on shop page (20 products per load)
- **LocalStorage fallback** for cart/wishlist when not logged in

## Image Standards

| Type | Format | Max Width | Max Size |
|------|--------|-----------|----------|
| Hero | WebP | 1920px | 300KB |
| Product | WebP | 1200px | 200KB |
| Thumbnail | WebP | 300px | 50KB |
| Category | WebP | 800px | 150KB |
| Logo | WebP | 200px | 30KB |

## Project Structure

```
starboy-bd-ecommerce/
├── public/
│   └── images/          # Local images (hero, logo)
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx     # Homepage (static + ISR)
│   │   ├── shop/
│   │   ├── product/[id]/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── search/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── admin/
│   ├── components/
│   │   ├── layout/      # Navbar, Footer, MobileMenu, AnnouncementBar
│   │   ├── sections/    # Hero, FeaturedCategories, NewArrivals, etc.
│   │   └── ui/          # ProductCard, CategoryCard
│   ├── context/         # AuthContext, CartContext, WishlistContext
│   ├── lib/             # Firebase, utils, data helpers
│   └── types/           # TypeScript type definitions
├── next.config.js       # Image optimization config
├── tailwind.config.ts   # Theme and custom utilities
└── package.json
```

## License

© 2026 STARBOY BD. All Rights Reserved.


---

## ✅ ISR / Server Rendering — ACTUAL STATUS (updated)

The homepage, shop, and product pages are now **true Server Components with ISR**:

- **Homepage** (`src/app/page.tsx`): `export const revalidate = 3600` — catalog data fetched once on the server per hour and shared by ALL visitors (not per-visitor).
- **Shop** (`src/app/shop/page.tsx`): `revalidate = 3600`, fetches catalog server-side, hands it to the interactive client UI.
- **Product** (`src/app/product/[id]/page.tsx`): `revalidate = 1800` — product, related items and initial reviews fetched server-side and cached.

Data is fetched via the Firestore REST API wrapped in `fetch(..., { next: { revalidate } })`, so **storefront browsing no longer scales Firestore reads per-visitor** — reads are roughly flat regardless of traffic. Interactive features (cart, wishlist, chat, posting reviews, likes/comments) remain client-side.
