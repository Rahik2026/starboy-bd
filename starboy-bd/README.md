# STARBOY BD — Premium E-Commerce Platform

A production-ready luxury e-commerce starter built with **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and a scalable architecture ready for **Firebase** and **Supabase** integration.

---

## Features

- **Luxury UI/UX** inspired by Apple, Stripe, and premium fashion houses
- **Mobile-first** responsive design with smooth animations
- **Homepage**: Hero, Featured Categories, New Arrivals, Trending, Best Sellers, Brand Experience, Stats, Testimonials, Newsletter, Footer
- **Shop & Product Pages** with filters, sorting, search, and related products
- **Cart & Wishlist** with localStorage persistence (ready for Supabase sync)
- **Authentication** UI with phone OTP, login/register (ready for Firebase Auth)
- **User Dashboard** with Profile, Wishlist, Orders, Messages, Reviews, Settings
- **Admin Dashboard** with Overview, Products, Categories, Messages, Announcements, Analytics
- **Search** with live suggestions and trending keywords
- **Announcement bar** system (admin-ready)
- **Messaging system** UI between users and admin
- **SEO-friendly** metadata and structure

---

## Tech Stack

| Layer        | Technology                               |
|--------------|------------------------------------------|
| Framework    | Next.js 14 (App Router)                  |
| Language     | TypeScript                               |
| Styling      | Tailwind CSS                             |
| Animation    | Framer Motion                            |
| Icons        | Lucide React                             |
| Auth         | Firebase Auth (config ready)             |
| Database     | Supabase (config ready)                  |
| Deployment   | Vercel                                   |

---

## Getting Started

### 1. Install dependencies

```bash
cd starboy-bd
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase and Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_FIREBASE_*` — from Firebase Console
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Project Settings
- `ADMIN_GMAIL` — sets automatic admin role in announcement system logic

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Production Deployment (Vercel)

### Option A: Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: Vercel Dashboard (Recommended)

1. Push this folder to a **GitHub / GitLab / Bitbucket** repository.
2. Import the repository on [vercel.com](https://vercel.com).
3. Add your environment variables in **Project Settings > Environment Variables**.
4. Deploy. Vercel will build and host automatically.

### Build configuration

`next.config.js` is already optimized for production static + dynamic rendering with remote image patterns for Unsplash, Firebase Storage, and Supabase.

---

## Backend Integration Guide

### Firebase (Auth & Analytics)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Phone Authentication** under Authentication > Sign-in method.
3. Copy your project config into `.env.local`.
4. Replace the mock login/register logic in `src/context/AuthContext.tsx` with Firebase SDK calls.
5. Use Firebase Analytics for tracking user activity and product statistics.

### Supabase (Database & Storage)

1. Create a project at [supabase.com](https://supabase.com).
2. Create tables: `products`, `categories`, `orders`, `reviews`, `messages`, `announcements`.
3. Copy URL and Anon Key into `.env.local`.
4. Replace mock data in `src/data/products.ts` with Supabase client queries via `src/lib/supabase.ts`.
5. Use Supabase Storage for product/category images.

### Admin Auto-Assignment

In the auth context and admin dashboard, any user whose email matches `ADMIN_GMAIL` or who uses the demo password `admin123` is treated as an admin. In production, enforce this via custom claims or role columns in Supabase.

---

## Folder Structure

```
starboy-bd/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable UI & section components
│   ├── context/          # React Context (Auth, Cart, Wishlist)
│   ├── data/             # Mock data & seed content
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & backend clients (Firebase/Supabase stubs)
│   ├── types/            # TypeScript types
│   └── styles/           # Global CSS
├── public/               # Static assets
├── .env.local.example    # Environment template
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind theme (brand colors, shadows)
└── package.json
```

---

## License

Private / Commercial — STARBOY BD Brand.

---

**Built for the modern standard.**
