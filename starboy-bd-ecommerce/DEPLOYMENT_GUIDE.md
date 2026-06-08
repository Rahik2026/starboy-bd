# Deployment Guide for STARBOY BD

## Vercel Deployment

### 1. Connect Repository

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy

### 2. Environment Variables

No additional environment variables needed — Firebase config is in code.

For admin email override (optional):
```
NEXT_PUBLIC_ADMIN_EMAIL=your-admin@email.com
```

### 3. Build Settings

Vercel auto-detects Next.js 14. Default settings work.

### 4. Post-Deployment

1. Visit your deployed URL
2. Navigate to `/admin`
3. Initialize the Firestore database
4. Add products via the admin panel

## Performance Notes

- Homepage is statically generated (ISR every 1 hour)
- Images are optimized to WebP with 24-hour cache
- Cart and wishlist use localStorage for guest users
- All below-fold sections are lazy-loaded

## Firebase Setup

If your Firestore database is not set up:

1. Go to `/admin` as an admin user
2. Click "Initialize Firestore Database"
3. Or manually add demo data through the admin panel

## Image Upload Guidelines

When adding product images:

1. Convert to **WebP** format
2. Resize to **max 1200px width**
3. Keep file size **under 200KB**
4. Use 3:4 aspect ratio (portrait) for product images
5. Use 16:9 for hero/banners (max 1920px)

## Monitoring Vercel Usage

- Check Vercel dashboard for bandwidth usage
- Image transformations are cached for 24 hours
- Static pages serve from CDN (zero compute cost)
