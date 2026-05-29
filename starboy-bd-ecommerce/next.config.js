/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: false,
    // Fewer device sizes = fewer Vercel image transformations
    deviceSizes: [640, 750, 1080],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ["image/webp"], // WebP ONLY — saves 30%+ bandwidth
    minimumCacheTTL: 86400, // Cache images for 24 hours (saves transformations)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  compress: true,
  poweredByHeader: false,
  // Reduce stale-while-revalidate to save bandwidth
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;
