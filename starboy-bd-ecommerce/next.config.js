/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // NOTE: kept as a broad HTTPS allow-list because product images are added
    // as direct links from many possible hosts (Firebase Storage, Unsplash,
    // imgbb, Cloudinary, your own CDN, etc.). If you standardise on a few hosts,
    // swap `remotePatterns` for the locked-down list below for tighter security.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // ---- LOCKED-DOWN ALTERNATIVE (uncomment + edit, then remove the line above) ----
    // remotePatterns: [
    //   { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    //   { protocol: "https", hostname: "images.unsplash.com" },
    //   { protocol: "https", hostname: "i.ibb.co" },
    //   { protocol: "https", hostname: "res.cloudinary.com" },
    //   { protocol: "https", hostname: "lh3.googleusercontent.com" },
    // ],
    unoptimized: false,
    // Fewer device sizes = fewer Vercel image transformations
    deviceSizes: [640, 750, 1080],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ["image/webp"], // WebP ONLY — saves 30%+ bandwidth
    minimumCacheTTL: 86400, // Cache images for 24 hours (saves transformations)
    // SECURITY: SVGs can embed scripts. Disabled — product images should be
    // raster (WebP/JPG/PNG). Re-enable only if you must serve trusted SVGs.
    dangerouslyAllowSVG: false,
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

  // ===========================================================================
  // SECURITY HEADERS (added) — sent on every response, app-wide.
  // ---------------------------------------------------------------------------
  // WHY: hardens the site against clickjacking, protocol-downgrade (HTTP),
  // MIME-sniffing, referrer leakage and abuse of powerful browser features.
  // SAFE BY DESIGN: none of these change app behaviour or break Firebase /
  // Google API calls, framer-motion, or external product images. A strict
  // Content-Security-Policy is intentionally NOT added here because it could
  // block those legitimate cross-origin calls — add it later only with testing.
  // No console steps, no deploy ordering: works the moment you publish.
  // ===========================================================================
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Force browsers to always use HTTPS for 2 years (incl. subdomains).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Block the site from being framed by others (anti-clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Stop the browser from MIME-sniffing responses.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak full URLs/paths to third parties via the Referer header.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable powerful browser features the storefront doesn't use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Limit cross-origin window references (anti tab-nabbing).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
// ===========================================================================
// WEBPACK PATH ALIAS — explicitly resolve @/ to ./src/
// Fixes "Module not found" errors on Vercel by ensuring webpack resolves
// the @ path alias from the project subdirectory correctly.
// ===========================================================================
  webpack: (config) => {
    config.resolve.alias["@"] = require("path").resolve(__dirname, "src");
    return config;
  },

module.exports = nextConfig;
